import ActivityKit
import Foundation
import RoutineKit
import Security
import SwiftUI
import WidgetKit

enum AppTab: Hashable {
    case today, stats, routines, settings
}

/// 화면 전체가 보는 상태. 고치면 곧바로 파일에 쓰고(위젯과 공유), 2초 뒤 서버와 맞춘다.
@MainActor
final class AppModel: ObservableObject, RoutineDBHolder {
    @Published var db: RoutineDB
    @Published var today: String
    @Published var selectedDate: String
    @Published var tab: AppTab = .today
    @Published var syncing = false
    @Published var notice: String?
    @Published var mondayFirst: Bool {
        didSet { AppConfig.mondayFirst = mondayFirst }
    }
    @Published var serverURL: String {
        didSet { AppConfig.serverURL = serverURL }
    }
    @Published var syncEnabled: Bool {
        didSet {
            AppConfig.syncEnabled = syncEnabled
            if syncEnabled { scheduleSync(after: 0) }
        }
    }
    @Published private(set) var hasToken: Bool

    let store = AppConfig.store
    private var pending: Task<Void, Never>?
    private var ticker: Timer?
    private var observer: NSObjectProtocol?

    init() {
        let now = AppConfig.today()
        db = AppConfig.store.load()
        today = now
        selectedDate = now
        mondayFirst = AppConfig.mondayFirst
        serverURL = AppConfig.serverURL
        syncEnabled = AppConfig.syncEnabled
        hasToken = TokenStore.read() != nil
        observer = NotificationCenter.default.addObserver(forName: .routineStoreChanged, object: nil, queue: .main) { [weak self] _ in
            Task { @MainActor in self?.reload() }
        }
    }

    // MARK: 저장 · 다시 읽기

    func persist() {
        do {
            try store.save(db)
        } catch {
            notice = "저장하지 못했어요: \(error.localizedDescription)"
        }
        WidgetCenter.shared.reloadAllTimelines()
    }

    /// 위젯·잠금화면 단추가 파일을 고쳤을 수 있다 — 앱이 앞으로 올 때마다 다시 읽는다.
    func reload() {
        db = store.load()
        refreshToday()
        syncLiveActivity()
    }

    func refreshToday() {
        let now = AppConfig.today()
        guard now != today else { return }
        if selectedDate == today { selectedDate = now }
        today = now
    }

    func becameActive() {
        reload()
        scheduleSync(after: 0)
        ticker?.invalidate()
        ticker = Timer.scheduledTimer(withTimeInterval: 60, repeats: true) { [weak self] _ in
            Task { @MainActor in
                self?.refreshToday()
                self?.scheduleSync(after: 0)
            }
        }
    }

    func resignedActive() {
        ticker?.invalidate()
        ticker = nil
        scheduleSync(after: 0)
    }

    // MARK: 고치기

    @discardableResult
    private func mutate(_ body: (inout RoutineDB) throws -> Void) -> Bool {
        var next = db
        do {
            try body(&next)
        } catch {
            notice = error.localizedDescription
            return false
        }
        db = next
        persist()
        syncLiveActivity()
        scheduleSync()
        return true
    }

    func toggle(_ r: Routine, on date: String) {
        let done = db.log(r.id, date)?.done == true
        var logged: RoutineLog?
        let ok = mutate { db in
            logged = try RoutineEngine.check(r.id, date: date, done: !done, in: &db, now: Date(), today: today)
        }
        if ok, let logged, logged.done, date == today { celebrateIfAllDone() }
    }

    func setMinutes(_ r: Routine, on date: String, minutes: Int) {
        var reached = false
        mutate { db in
            reached = try RoutineEngine.setMinutes(r.id, date: date, minutes: minutes, in: &db, now: Date(), today: today).reachedGoal
        }
        if reached {
            notice = "목표 시간 달성 — ‘\(r.title)’ 완료로 표시했어요"
            celebrateIfAllDone()
        }
    }

    func toggleTimer(_ r: Routine) {
        if db.timer?.routineId == r.id {
            stopTimer()
            return
        }
        var committed: TimerCommit?
        mutate { db in
            committed = try RoutineEngine.startTimer(r.id, in: &db, now: Date(), today: today)
        }
        announce(committed)
    }

    func stopTimer() {
        var committed: TimerCommit?
        mutate { db in
            committed = RoutineEngine.stopTimer(in: &db, now: Date())
        }
        announce(committed)
    }

    private func announce(_ c: TimerCommit?) {
        guard let c else { return }
        let title = db.routine(c.log.routineId)?.title ?? "루틴"
        if c.capped {
            notice = "‘\(title)’ 타이머가 너무 오래 켜져 있어 12시간까지만 기록했어요"
        } else if c.reachedGoal {
            notice = "목표 시간 달성 — ‘\(title)’ 완료로 표시했어요"
            celebrateIfAllDone()
        }
    }

    private func celebrateIfAllDone() {
        let s = RoutineStats.day(db.routines, db, today, today: today)
        guard s.scheduled > 0, s.done == s.scheduled else { return }
        let streak = RoutineStats.perfectStreak(db.routines, db, today: today).current
        notice = streak > 1 ? "오늘 루틴을 모두 끝냈어요 — \(streak)일 연속" : "오늘 루틴을 모두 끝냈어요"
    }

    @discardableResult
    func add(_ input: RoutineInput) -> Bool {
        mutate { db in _ = try RoutineEngine.add(input, to: &db, now: Date()) }
    }

    @discardableResult
    func update(_ id: String, _ input: RoutineInput) -> Bool {
        mutate { db in try RoutineEngine.update(id, input, in: &db, now: Date()) }
    }

    func setArchived(_ r: Routine, _ archived: Bool) {
        mutate { db in try RoutineEngine.setArchived(r.id, archived, in: &db, now: Date(), today: today) }
    }

    func delete(_ r: Routine) {
        mutate { db in try RoutineEngine.delete(r.id, in: &db, now: Date()) }
    }

    func move(from source: IndexSet, to destination: Int) {
        var ids = db.activeRoutines.map(\.id)
        ids.move(fromOffsets: source, toOffset: destination)
        let archived = db.sortedRoutines.filter(\.isArchived).map(\.id)
        mutate { db in RoutineEngine.reorder(ids + archived, in: &db, now: Date()) }
    }

    // MARK: 동기화

    func setToken(_ token: String) {
        let clean = token.trimmingCharacters(in: .whitespacesAndNewlines)
        TokenStore.write(clean.isEmpty ? nil : clean)
        hasToken = !clean.isEmpty
        if hasToken {
            scheduleSync(after: 0)
        } else {
            // 다른 계정 토큰을 넣을 수도 있다 — 다음 연결은 처음부터.
            RoutineSync.unlink(&db)
            persist()
        }
    }

    func scheduleSync(after seconds: Double = 2) {
        guard syncEnabled else { return }
        pending?.cancel()
        pending = Task { [weak self] in
            if seconds > 0 {
                try? await Task.sleep(nanoseconds: UInt64(seconds * 1_000_000_000))
            }
            guard !Task.isCancelled else { return }
            await self?.syncNow()
        }
    }

    func syncNow() async {
        guard syncEnabled, !syncing else { return }
        guard let url = URL(string: serverURL.trimmingCharacters(in: .whitespacesAndNewlines)), url.scheme != nil,
              let token = TokenStore.read() else {
            db.sync.lastError = SyncError.notConfigured.errorDescription
            persist()
            return
        }
        syncing = true
        // 위젯이 고친 것을 먼저 읽어 둔다 — 그 위에서 맞춘다.
        db = store.load()
        do {
            try await RoutineSync.run(self, transport: HTTPRoutineTransport(baseURL: url, token: token))
        } catch {
            // lastError 에 적혀 있다 — 화면은 설정 탭에서 보여 준다.
        }
        syncing = false
        refreshToday()
        syncLiveActivity()
    }

    // MARK: 잠금화면 타이머

    func syncLiveActivity() {
        guard ActivityAuthorizationInfo().areActivitiesEnabled else { return }
        let running = Activity<RoutineActivityAttributes>.activities
        guard let t = db.timer, let r = db.routine(t.routineId), let started = Clock.parse(t.startedAt) else {
            for a in running { Task { await a.end(nil, dismissalPolicy: .immediate) } }
            return
        }
        let state = RoutineActivityAttributes.ContentState(
            startedAt: started,
            baseSecs: db.log(r.id, t.date)?.secs ?? 0,
            goalSecs: r.goalMin.map { $0 * 60 }
        )
        if let mine = running.first(where: { $0.attributes.routineId == r.id }) {
            for a in running where a.id != mine.id { Task { await a.end(nil, dismissalPolicy: .immediate) } }
            Task { await mine.update(ActivityContent(state: state, staleDate: nil)) }
        } else {
            for a in running { Task { await a.end(nil, dismissalPolicy: .immediate) } }
            let attributes = RoutineActivityAttributes(routineId: r.id, title: r.title, color: r.color.rawValue)
            _ = try? Activity.request(attributes: attributes, content: ActivityContent(state: state, staleDate: nil))
        }
    }
}

/// 개인 토큰은 키체인에만 (이 앱 전용).
enum TokenStore {
    static let service = "com.vallista.bento.routine.sync"
    static let account = "nyanotion"

    static func read() -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]
        var out: AnyObject?
        guard SecItemCopyMatching(query as CFDictionary, &out) == errSecSuccess,
              let data = out as? Data, let token = String(data: data, encoding: .utf8), !token.isEmpty else { return nil }
        return token
    }

    static func write(_ token: String?) {
        let base: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
        ]
        SecItemDelete(base as CFDictionary)
        guard let token, let data = token.data(using: .utf8) else { return }
        var add = base
        add[kSecValueData as String] = data
        add[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlock
        SecItemAdd(add as CFDictionary, nil)
    }
}
