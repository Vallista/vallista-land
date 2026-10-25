import Foundation

/// 고치는 규칙 — 맥 Bento 의 `commands/routines.rs` 와 같다.
/// 고칠 때마다 그 줄의 `updatedAt` 과 동기화 "보낼 것"에 지금 시각을 적는다.
public enum RoutineError: LocalizedError, Equatable {
    case invalid(String)
    case notFound
    case futureDate
    case beforeStart(String)
    case archived

    public var errorDescription: String? {
        switch self {
        case .invalid(let message): return message
        case .notFound: return "루틴을 찾을 수 없어요"
        case .futureDate: return "미래 날짜는 기록할 수 없어요"
        case .beforeStart(let start): return "시작일(\(start)) 이전 날짜는 기록할 수 없어요"
        case .archived: return "보관한 루틴은 타이머를 켤 수 없어요"
        }
    }
}

public struct RoutineInput: Equatable, Sendable {
    public var title: String
    public var color: RoutineColor
    public var slot: RoutineSlot
    public var schedule: RoutineSchedule
    public var goalMin: Int?
    public var startDate: String

    public init(
        title: String,
        color: RoutineColor = .blue,
        slot: RoutineSlot = .anytime,
        schedule: RoutineSchedule = .daily,
        goalMin: Int? = nil,
        startDate: String
    ) {
        self.title = title
        self.color = color
        self.slot = slot
        self.schedule = schedule
        self.goalMin = goalMin
        self.startDate = startDate
    }

    public init(_ r: Routine) {
        self.init(title: r.title, color: r.color, slot: r.slot, schedule: r.schedule, goalMin: r.goalMin, startDate: r.startDate)
    }
}

public struct TimerCommit: Equatable, Sendable {
    public var log: RoutineLog
    public var addedSecs: Int
    /// 12시간 상한에 걸려 잘렸는가
    public var capped: Bool
    /// 이번 기록으로 목표 시간을 채워 자동 완료됐는가
    public var reachedGoal: Bool
}

public enum RoutineEngine {
    /// 타이머를 끄지 않고 둔 경우를 대비한 세션 하나의 상한
    public static let maxSessionSecs = 12 * 3600
    static let maxDaySecs = 24 * 3600
    static let maxSessionsPerLog = 100

    // MARK: 입력 검사

    public static func normalize(_ input: RoutineInput) throws -> RoutineInput {
        var out = input
        out.title = input.title.trimmingCharacters(in: .whitespacesAndNewlines)
        if out.title.isEmpty { throw RoutineError.invalid("루틴 이름을 입력하세요") }
        if out.title.count > 60 { throw RoutineError.invalid("루틴 이름은 60자 이하로 적어주세요") }
        switch input.schedule.freq {
        case .daily:
            out.schedule = .daily
        case .weekly:
            let days = Array(Set(input.schedule.weekdays)).sorted()
            if days.isEmpty { throw RoutineError.invalid("요일을 하나 이상 선택하세요") }
            if days.contains(where: { $0 < 0 || $0 > 6 }) { throw RoutineError.invalid("요일 값이 올바르지 않습니다") }
            out.schedule = days.count == 7 ? .daily : RoutineSchedule(freq: .weekly, weekdays: days)
        }
        if let goal = input.goalMin, goal <= 0 { out.goalMin = nil }
        if let goal = out.goalMin, goal > 600 { throw RoutineError.invalid("목표 시간은 600분 이하로 정해주세요") }
        out.startDate = input.startDate.trimmingCharacters(in: .whitespaces)
        if !DayKey.isValid(out.startDate) { throw RoutineError.invalid("시작일은 YYYY-MM-DD 형식이어야 합니다") }
        return out
    }

    static func checkDate(_ routine: Routine, _ date: String, today: String) throws {
        guard DayKey.isValid(date) else { throw RoutineError.invalid("날짜는 YYYY-MM-DD 형식이어야 합니다") }
        if date > today { throw RoutineError.futureDate }
        if date < routine.startDate { throw RoutineError.beforeStart(routine.startDate) }
    }

    public static func newID() -> String {
        "rt_" + UUID().uuidString.replacingOccurrences(of: "-", with: "").lowercased()
    }

    // MARK: 표시

    static func touch(_ db: inout RoutineDB, routineAt index: Int, now: String) {
        db.routines[index].updatedAt = now
        db.sync.dirtyRoutines[db.routines[index].id] = now
    }

    static func put(_ db: inout RoutineDB, log: RoutineLog, now: String) {
        var l = log
        l.updatedAt = now
        if l.isEmpty {
            db.logs.removeValue(forKey: l.id)
        } else {
            db.logs[l.id] = l
        }
        db.sync.dirtyLogs[l.id] = now
    }

    static func setTimer(_ db: inout RoutineDB, _ timer: RoutineTimer?, now: String) {
        db.timer = timer
        db.sync.dirtyTimer = now
    }

    // MARK: 루틴

    @discardableResult
    public static func add(_ input: RoutineInput, to db: inout RoutineDB, now: Date) throws -> Routine {
        let clean = try normalize(input)
        let at = Clock.iso(now)
        let order = (db.routines.map(\.order).max() ?? -1) + 1
        let r = Routine(
            id: newID(),
            title: clean.title,
            color: clean.color,
            slot: clean.slot,
            schedule: clean.schedule,
            goalMin: clean.goalMin,
            startDate: clean.startDate,
            order: order,
            createdAt: at,
            updatedAt: at
        )
        db.routines.append(r)
        db.sync.dirtyRoutines[r.id] = at
        return r
    }

    public static func update(_ id: String, _ input: RoutineInput, in db: inout RoutineDB, now: Date) throws {
        let clean = try normalize(input)
        guard let i = db.routines.firstIndex(where: { $0.id == id }) else { throw RoutineError.notFound }
        db.routines[i].title = clean.title
        db.routines[i].color = clean.color
        db.routines[i].slot = clean.slot
        db.routines[i].schedule = clean.schedule
        db.routines[i].goalMin = clean.goalMin
        db.routines[i].startDate = clean.startDate
        touch(&db, routineAt: i, now: Clock.iso(now))
    }

    /// 보관: 오늘부터 예정이 아니다(돌던 타이머는 기록하고 멈춘다). 꺼내기: 보관일~어제를 쉬는 구간으로 남긴다.
    public static func setArchived(_ id: String, _ archived: Bool, in db: inout RoutineDB, now: Date, today: String) throws {
        guard db.routine(id) != nil else { throw RoutineError.notFound }
        if archived, db.timer?.routineId == id { _ = stopTimer(in: &db, now: now) }
        guard let i = db.routines.firstIndex(where: { $0.id == id }) else { throw RoutineError.notFound }
        if archived {
            if db.routines[i].archivedAt == nil { db.routines[i].archivedAt = today }
        } else if let from = db.routines[i].archivedAt {
            db.routines[i].archivedAt = nil
            let to = DayKey.add(today, -1)
            if from <= to { db.routines[i].pauses.append(RoutinePause(from: from, to: to)) }
        }
        touch(&db, routineAt: i, now: Clock.iso(now))
    }

    /// 루틴과 그 기록을 지운다. 서버도 그 루틴의 기록을 따라 지우므로 기록은 따로 보내지 않는다.
    public static func delete(_ id: String, in db: inout RoutineDB, now: Date) throws {
        guard db.routine(id) != nil else { throw RoutineError.notFound }
        let at = Clock.iso(now)
        db.routines.removeAll { $0.id == id }
        let logKeys = db.logs.filter { $0.value.routineId == id }.map(\.key)
        for key in logKeys { db.logs.removeValue(forKey: key) }
        let dirtyKeys = db.sync.dirtyLogs.keys.filter { $0.hasPrefix("\(id):") }
        for key in dirtyKeys { db.sync.dirtyLogs.removeValue(forKey: key) }
        db.sync.dirtyRoutines[id] = at
        if db.timer?.routineId == id { setTimer(&db, nil, now: at) }
    }

    /// `ids` 순서대로 0,1,2… 를 다시 매긴다. 목록에 없는 것은 뒤로. 바뀐 것만 보낸다.
    public static func reorder(_ ids: [String], in db: inout RoutineDB, now: Date) {
        let at = Clock.iso(now)
        var next = 0
        var seen = Set<String>()
        var wanted: [String: Int] = [:]
        for id in ids where !seen.contains(id) && db.routine(id) != nil {
            seen.insert(id)
            wanted[id] = next
            next += 1
        }
        for r in db.sortedRoutines where !seen.contains(r.id) {
            wanted[r.id] = next
            next += 1
        }
        for i in db.routines.indices {
            if let order = wanted[db.routines[i].id], db.routines[i].order != order {
                db.routines[i].order = order
                touch(&db, routineAt: i, now: at)
            }
        }
    }

    // MARK: 기록

    @discardableResult
    public static func check(_ routineId: String, date: String, done: Bool, in db: inout RoutineDB, now: Date, today: String) throws -> RoutineLog {
        guard let r = db.routine(routineId) else { throw RoutineError.notFound }
        try checkDate(r, date, today: today)
        let at = Clock.iso(now)
        var log = db.log(routineId, date) ?? RoutineLog(routineId: routineId, date: date, updatedAt: at)
        if log.done != done {
            log.done = done
            log.doneAt = done ? at : nil
        }
        put(&db, log: log, now: at)
        log.updatedAt = at
        return log
    }

    /// 그날 기록 시간을 `minutes` 분으로 맞춘다. 목표를 채우면 자동 완료(되돌리진 않는다).
    @discardableResult
    public static func setMinutes(_ routineId: String, date: String, minutes: Int, in db: inout RoutineDB, now: Date, today: String) throws -> (log: RoutineLog, reachedGoal: Bool) {
        guard let r = db.routine(routineId) else { throw RoutineError.notFound }
        try checkDate(r, date, today: today)
        let at = Clock.iso(now)
        var log = db.log(routineId, date) ?? RoutineLog(routineId: routineId, date: date, updatedAt: at)
        log.secs = min(max(0, minutes) * 60, maxDaySecs)
        let reached = completeIfGoal(&log, goalMin: r.goalMin, at: at)
        put(&db, log: log, now: at)
        log.updatedAt = at
        return (log, reached)
    }

    static func completeIfGoal(_ log: inout RoutineLog, goalMin: Int?, at: String) -> Bool {
        guard let goal = goalMin, goal > 0, !log.done, log.secs >= goal * 60 else { return false }
        log.done = true
        log.doneAt = at
        return true
    }

    // MARK: 타이머

    /// 다른 루틴 타이머가 돌고 있으면 기록하고 넘어간다. 같은 루틴이면 그대로.
    @discardableResult
    public static func startTimer(_ routineId: String, in db: inout RoutineDB, now: Date, today: String) throws -> TimerCommit? {
        guard let r = db.routine(routineId) else { throw RoutineError.notFound }
        if r.isArchived { throw RoutineError.archived }
        try checkDate(r, today, today: today)
        if db.timer?.routineId == routineId { return nil }
        let committed = stopTimer(in: &db, now: now)
        let at = Clock.iso(now)
        setTimer(&db, RoutineTimer(routineId: routineId, date: today, startedAt: at), now: at)
        return committed
    }

    /// 돌던 타이머를 기록으로 옮기고 멈춘다. `discard` 면 기록 없이 멈춘다.
    @discardableResult
    public static func stopTimer(in db: inout RoutineDB, now: Date, discard: Bool = false) -> TimerCommit? {
        guard let timer = db.timer else { return nil }
        let at = Clock.iso(now)
        setTimer(&db, nil, now: at)
        guard !discard, let r = db.routine(timer.routineId), let started = Clock.parse(timer.startedAt) else { return nil }
        let elapsed = max(0, Int(now.timeIntervalSince(started)))
        let capped = elapsed > maxSessionSecs
        let secs = min(elapsed, maxSessionSecs)
        guard secs > 0 else { return nil }
        let end = capped ? started.addingTimeInterval(TimeInterval(maxSessionSecs)) : now
        var log = db.log(r.id, timer.date) ?? RoutineLog(routineId: r.id, date: timer.date, updatedAt: at)
        log.sessions.append(RoutineSession(start: Clock.iso(started), end: Clock.iso(end), secs: secs))
        if log.sessions.count > maxSessionsPerLog { log.sessions.removeFirst(log.sessions.count - maxSessionsPerLog) }
        log.secs = min(log.secs + secs, maxDaySecs)
        let reached = completeIfGoal(&log, goalMin: r.goalMin, at: at)
        put(&db, log: log, now: at)
        log.updatedAt = at
        return TimerCommit(log: log, addedSecs: secs, capped: capped, reachedGoal: reached)
    }

    /// 지금까지 지난 초 (타이머가 없으면 0)
    public static func elapsed(_ timer: RoutineTimer?, now: Date) -> Int {
        guard let timer, let started = Clock.parse(timer.startedAt) else { return 0 }
        return max(0, Int(now.timeIntervalSince(started)))
    }
}
