import Foundation

// 냥노션 서버(`/api/sync/routines/changes`)와 맞추기. 규칙은 서버 `docs/13-sync.md` §루틴.
//   한 바퀴 = 올리기 → 받기. 올릴 것은 `SyncState` 의 dirty 표(고친 시각).
//   나중에 고친 쪽이 이긴다. 서버 것이 더 새로워 버려진 것은 응답의 `current` 로 곧바로 덮는다.
//   받은 것보다 이 기기에서 나중에 고쳤고 아직 안 올린 것은 덮지 않고 건너뛴다 — 다음 올리기가 이긴다.

// MARK: - 서버가 주는 모양

public struct ServerRoutine: Codable, Equatable, Sendable {
    public var id: String
    public var title: String
    public var color: RoutineColor
    public var slot: RoutineSlot
    public var schedule: RoutineSchedule
    public var goalMin: Int?
    public var startDate: String
    public var archivedAt: String?
    public var pauses: [RoutinePause]
    public var order: Int
    public var createdAt: String
    public var deleted: Bool
    public var updatedAt: String
    public var rev: Int

    var routine: Routine {
        Routine(
            id: id, title: title, color: color, slot: slot, schedule: schedule, goalMin: goalMin,
            startDate: startDate, archivedAt: archivedAt, pauses: pauses, order: order,
            createdAt: createdAt, updatedAt: updatedAt
        )
    }
}

public struct ServerLog: Codable, Equatable, Sendable {
    public var id: String
    public var routineId: String
    public var date: String
    public var done: Bool
    public var doneAt: String?
    public var secs: Int
    public var sessions: [RoutineSession]
    public var deleted: Bool
    public var updatedAt: String
    public var rev: Int

    var log: RoutineLog {
        RoutineLog(routineId: routineId, date: date, done: done, doneAt: doneAt, secs: secs, sessions: sessions, updatedAt: updatedAt)
    }
}

public struct ServerTimer: Codable, Equatable, Sendable {
    public var routineId: String?
    public var date: String?
    public var startedAt: String?
    public var updatedAt: String
    public var rev: Int
}

public struct ChangesResponse: Codable, Equatable, Sendable {
    public var routines: [ServerRoutine]
    public var logs: [ServerLog]
    public var timer: ServerTimer?
    public var cursor: Int
    public var more: Bool

    public init(routines: [ServerRoutine], logs: [ServerLog], timer: ServerTimer?, cursor: Int, more: Bool) {
        self.routines = routines
        self.logs = logs
        self.timer = timer
        self.cursor = cursor
        self.more = more
    }
}

public struct PushResponse: Codable, Equatable, Sendable {
    public struct Rejected: Codable, Equatable, Sendable {
        public var id: String
        public var reason: String
    }

    public struct Current: Codable, Equatable, Sendable {
        public var routines: [ServerRoutine]
        public var logs: [ServerLog]
        public var timer: ServerTimer?
    }

    public var applied: Int
    public var stale: [String]
    public var rejected: [Rejected]
    public var current: Current
}

// MARK: - 올리는 모양 (지운 것은 id·시각만, 비운 칸은 null 로 보낸다 — 빠진 칸은 서버가 "그대로")

public struct PushRoutine: Encodable, Equatable, Sendable {
    public var id: String
    public var updatedAt: String
    /// nil 이면 지운 것
    public var routine: Routine?

    enum Keys: String, CodingKey {
        case id, updatedAt, deleted, title, color, slot, schedule, goalMin, startDate, archivedAt, pauses, order, createdAt
    }

    public func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: Keys.self)
        try c.encode(id, forKey: .id)
        try c.encode(updatedAt, forKey: .updatedAt)
        guard let r = routine else {
            try c.encode(true, forKey: .deleted)
            return
        }
        try c.encode(r.title, forKey: .title)
        try c.encode(r.color, forKey: .color)
        try c.encode(r.slot, forKey: .slot)
        try c.encode(r.schedule, forKey: .schedule)
        if let goal = r.goalMin { try c.encode(goal, forKey: .goalMin) } else { try c.encodeNil(forKey: .goalMin) }
        try c.encode(r.startDate, forKey: .startDate)
        if let a = r.archivedAt { try c.encode(a, forKey: .archivedAt) } else { try c.encodeNil(forKey: .archivedAt) }
        try c.encode(r.pauses, forKey: .pauses)
        try c.encode(r.order, forKey: .order)
        try c.encode(r.createdAt, forKey: .createdAt)
    }
}

public struct PushLog: Encodable, Equatable, Sendable {
    public var routineId: String
    public var date: String
    public var updatedAt: String
    /// nil 이면 지운 것
    public var log: RoutineLog?

    enum Keys: String, CodingKey { case routineId, date, updatedAt, deleted, done, doneAt, secs, sessions }

    public func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: Keys.self)
        try c.encode(routineId, forKey: .routineId)
        try c.encode(date, forKey: .date)
        try c.encode(updatedAt, forKey: .updatedAt)
        guard let l = log else {
            try c.encode(true, forKey: .deleted)
            return
        }
        try c.encode(l.done, forKey: .done)
        if let at = l.doneAt { try c.encode(at, forKey: .doneAt) } else { try c.encodeNil(forKey: .doneAt) }
        try c.encode(l.secs, forKey: .secs)
        try c.encode(l.sessions, forKey: .sessions)
    }
}

public struct PushTimer: Encodable, Equatable, Sendable {
    public var timer: RoutineTimer?
    public var updatedAt: String

    enum Keys: String, CodingKey { case routineId, date, startedAt, updatedAt }

    public func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: Keys.self)
        if let t = timer {
            try c.encode(t.routineId, forKey: .routineId)
            try c.encode(t.date, forKey: .date)
            try c.encode(t.startedAt, forKey: .startedAt)
        } else {
            try c.encodeNil(forKey: .routineId)
        }
        try c.encode(updatedAt, forKey: .updatedAt)
    }
}

public struct PushBody: Encodable, Equatable, Sendable {
    public var routines: [PushRoutine]
    public var logs: [PushLog]
    public var timer: PushTimer?

    enum Keys: String, CodingKey { case routines, logs, timer }

    public func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: Keys.self)
        try c.encode(routines, forKey: .routines)
        try c.encode(logs, forKey: .logs)
        try c.encodeIfPresent(timer, forKey: .timer)
    }
}

// MARK: - 오가는 길

public protocol RoutineTransport: Sendable {
    func pull(since: Int) async throws -> ChangesResponse
    func push(_ body: PushBody) async throws -> PushResponse
}

public enum SyncError: LocalizedError, Equatable {
    case notConfigured
    case unauthorized(String)
    case http(Int, String)
    case network(String)

    public var errorDescription: String? {
        switch self {
        case .notConfigured: return "서버 주소와 토큰을 먼저 넣어 주세요"
        case .unauthorized(let m): return m.isEmpty ? "토큰이 맞지 않아요" : m
        case .http(let code, let m): return m.isEmpty ? "서버가 \(code) 를 돌려줬어요" : m
        case .network(let m): return "서버에 닿지 못했어요 — \(m)"
        }
    }
}

public struct HTTPRoutineTransport: RoutineTransport {
    public let baseURL: URL
    public let token: String
    let session: URLSession

    public init(baseURL: URL, token: String, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.token = token
        self.session = session
    }

    var endpoint: URL { baseURL.appendingPathComponent("api/sync/routines/changes") }

    public func pull(since: Int) async throws -> ChangesResponse {
        var comps = URLComponents(url: endpoint, resolvingAgainstBaseURL: false)
        comps?.queryItems = [URLQueryItem(name: "since", value: String(since))]
        guard let url = comps?.url else { throw SyncError.notConfigured }
        var req = URLRequest(url: url, timeoutInterval: 20)
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        return try await send(req)
    }

    public func push(_ body: PushBody) async throws -> PushResponse {
        var req = URLRequest(url: endpoint, timeoutInterval: 30)
        req.httpMethod = "POST"
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try JSONEncoder().encode(body)
        return try await send(req)
    }

    func send<T: Decodable>(_ req: URLRequest) async throws -> T {
        let pair: (Data, URLResponse)
        do {
            pair = try await session.data(for: req)
        } catch {
            throw SyncError.network(error.localizedDescription)
        }
        let (data, response) = pair
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        guard (200..<300).contains(status) else {
            struct Body: Decodable { var error: String? }
            let message = (try? JSONDecoder().decode(Body.self, from: data))?.error ?? ""
            throw status == 401 ? SyncError.unauthorized(message) : SyncError.http(status, message)
        }
        return try JSONDecoder().decode(T.self, from: data)
    }
}

// MARK: - 맞추기

/// 동기화가 고쳐 쓰는 저장소. 앱의 모델이 이걸 따른다(메인 스레드).
@MainActor
public protocol RoutineDBHolder: AnyObject {
    var db: RoutineDB { get set }
    func persist()
}

public struct SyncReport: Equatable, Sendable {
    public var pushed = 0
    public var stale = 0
    public var rejected = 0
    public var pulled = 0
    public init() {}
}

public enum RoutineSync {
    /// 한 번에 올리는 양 (서버 한도 5000 보다 넉넉히 아래)
    public static let batchLimit = 2000

    public struct Outgoing: Equatable, Sendable {
        public var body: PushBody
        var sentRoutines: [String: String] = [:]
        var sentLogs: [String: String] = [:]
        var sentTimer: String?
        /// 한도에 걸려 다 못 실었다
        var truncated = false
        public var isEmpty: Bool { body.routines.isEmpty && body.logs.isEmpty && body.timer == nil }
    }

    /// 처음 연결 — 로컬 전부를 아주 옛 시각으로 올릴 것에 적는다. 서버에 같은 것이 있으면 서버가 이긴다.
    public static func prepareFirstLink(_ db: inout RoutineDB) {
        guard !db.sync.linked else { return }
        for r in db.routines where db.sync.dirtyRoutines[r.id] == nil { db.sync.dirtyRoutines[r.id] = Clock.epoch }
        for (id, _) in db.logs where db.sync.dirtyLogs[id] == nil { db.sync.dirtyLogs[id] = Clock.epoch }
        if db.timer != nil && db.sync.dirtyTimer == nil { db.sync.dirtyTimer = Clock.epoch }
        db.sync.linked = true
    }

    public static func outgoing(_ db: RoutineDB, limit: Int = batchLimit) -> Outgoing {
        var out = Outgoing(body: PushBody(routines: [], logs: [], timer: nil))
        var room = limit
        for (id, at) in db.sync.dirtyRoutines.sorted(by: { $0.key < $1.key }) {
            guard room > 0 else { out.truncated = true; break }
            out.body.routines.append(PushRoutine(id: id, updatedAt: at, routine: db.routine(id)))
            out.sentRoutines[id] = at
            room -= 1
        }
        for (id, at) in db.sync.dirtyLogs.sorted(by: { $0.key < $1.key }) {
            guard room > 0 else { out.truncated = true; break }
            // id = <routineId>:<date> — 날짜에는 ':' 가 없으므로 마지막 ':' 로 가른다.
            guard let cut = id.lastIndex(of: ":") else { continue }
            let routineId = String(id[..<cut])
            let date = String(id[id.index(after: cut)...])
            out.body.logs.append(PushLog(routineId: routineId, date: date, updatedAt: at, log: db.logs[id]))
            out.sentLogs[id] = at
            room -= 1
        }
        if let at = db.sync.dirtyTimer {
            out.body.timer = PushTimer(timer: db.timer, updatedAt: at)
            out.sentTimer = at
        }
        return out
    }

    /// 올린 결과를 반영한다 — 보낸 뒤 다시 고치지 않은 것만 "보낼 것"에서 뺀다.
    public static func applyPushResult(_ result: PushResponse, sent: Outgoing, to db: inout RoutineDB) {
        for (id, at) in sent.sentRoutines where db.sync.dirtyRoutines[id] == at { db.sync.dirtyRoutines.removeValue(forKey: id) }
        for (id, at) in sent.sentLogs where db.sync.dirtyLogs[id] == at { db.sync.dirtyLogs.removeValue(forKey: id) }
        if let at = sent.sentTimer, db.sync.dirtyTimer == at { db.sync.dirtyTimer = nil }
        // 받지 않은 것은 다시 보내도 또 거절된다 — 내려놓는다.
        for r in result.rejected {
            db.sync.dirtyRoutines.removeValue(forKey: r.id)
            db.sync.dirtyLogs.removeValue(forKey: r.id)
            if r.id == "timer" { db.sync.dirtyTimer = nil }
        }
        // 서버가 이긴 것은 지금 서버 값으로 곧바로 덮는다.
        for r in result.current.routines { applyRoutine(r, to: &db, force: true) }
        for l in result.current.logs { applyLog(l, to: &db, force: true) }
        if let t = result.current.timer { applyTimer(t, to: &db, force: true) }
    }

    public static func applyPull(_ changes: ChangesResponse, to db: inout RoutineDB) {
        for r in changes.routines { applyRoutine(r, to: &db, force: false) }
        for l in changes.logs { applyLog(l, to: &db, force: false) }
        if let t = changes.timer { applyTimer(t, to: &db, force: false) }
        db.sync.cursor = max(db.sync.cursor, changes.cursor)
    }

    static func applyRoutine(_ w: ServerRoutine, to db: inout RoutineDB, force: Bool) {
        if !force, let mine = db.sync.dirtyRoutines[w.id], Clock.isAfter(mine, w.updatedAt) { return }
        db.sync.dirtyRoutines.removeValue(forKey: w.id)
        if w.deleted {
            db.routines.removeAll { $0.id == w.id }
            let logKeys = db.logs.filter { $0.value.routineId == w.id }.map(\.key)
            for key in logKeys { db.logs.removeValue(forKey: key) }
            let dirtyKeys = db.sync.dirtyLogs.keys.filter { $0.hasPrefix("\(w.id):") }
            for key in dirtyKeys { db.sync.dirtyLogs.removeValue(forKey: key) }
            if db.timer?.routineId == w.id { db.timer = nil }
            return
        }
        if let i = db.routines.firstIndex(where: { $0.id == w.id }) {
            db.routines[i] = w.routine
        } else {
            db.routines.append(w.routine)
        }
    }

    static func applyLog(_ w: ServerLog, to db: inout RoutineDB, force: Bool) {
        let id = RoutineLog.id(w.routineId, w.date)
        if !force, let mine = db.sync.dirtyLogs[id], Clock.isAfter(mine, w.updatedAt) { return }
        db.sync.dirtyLogs.removeValue(forKey: id)
        if w.deleted {
            db.logs.removeValue(forKey: id)
        } else {
            db.logs[id] = w.log
        }
    }

    static func applyTimer(_ w: ServerTimer, to db: inout RoutineDB, force: Bool) {
        if !force, let mine = db.sync.dirtyTimer, Clock.isAfter(mine, w.updatedAt) { return }
        db.sync.dirtyTimer = nil
        if let rid = w.routineId, let date = w.date, let started = w.startedAt {
            db.timer = RoutineTimer(routineId: rid, date: date, startedAt: started)
        } else {
            db.timer = nil
        }
    }

    /// 한 바퀴: 올리기(한도마다 나눠서) → 받기(`more` 면 이어서).
    @MainActor
    @discardableResult
    public static func run(_ holder: RoutineDBHolder, transport: RoutineTransport, now: @escaping () -> Date = { Date() }) async throws -> SyncReport {
        var report = SyncReport()
        if !holder.db.sync.linked {
            prepareFirstLink(&holder.db)
            holder.persist()
        }
        do {
            for _ in 0..<20 {
                let out = outgoing(holder.db)
                if out.isEmpty { break }
                let result = try await transport.push(out.body)
                applyPushResult(result, sent: out, to: &holder.db)
                report.pushed += result.applied
                report.stale += result.stale.count
                report.rejected += result.rejected.count
                holder.persist()
                if !out.truncated { break }
            }
            for _ in 0..<50 {
                let changes = try await transport.pull(since: holder.db.sync.cursor)
                applyPull(changes, to: &holder.db)
                report.pulled += changes.routines.count + changes.logs.count + (changes.timer == nil ? 0 : 1)
                holder.persist()
                if !changes.more { break }
            }
            holder.db.sync.lastSyncAt = Clock.iso(now())
            holder.db.sync.lastError = nil
            holder.persist()
            return report
        } catch {
            holder.db.sync.lastError = error.localizedDescription
            holder.persist()
            throw error
        }
    }
}
