import Foundation

// 맥 Bento(`apps/admin`)·도란 서버(`/api/sync/routines`)와 같은 모양.
// JSON 칸 이름은 서버와 같다(camelCase).

public enum RoutineColor: String, Codable, CaseIterable, Sendable {
    case blue, orange, aqua, yellow, magenta, violet

    public var label: String {
        switch self {
        case .blue: return "파랑"
        case .orange: return "주황"
        case .aqua: return "청록"
        case .yellow: return "노랑"
        case .magenta: return "분홍"
        case .violet: return "보라"
        }
    }

    public init(from decoder: Decoder) throws {
        let raw = try decoder.singleValueContainer().decode(String.self)
        self = RoutineColor(rawValue: raw) ?? .blue
    }
}

public enum RoutineSlot: String, Codable, CaseIterable, Sendable {
    case morning, afternoon, evening, anytime

    public var label: String {
        switch self {
        case .morning: return "아침"
        case .afternoon: return "오후"
        case .evening: return "저녁"
        case .anytime: return "언제든"
        }
    }

    public init(from decoder: Decoder) throws {
        let raw = try decoder.singleValueContainer().decode(String.self)
        self = RoutineSlot(rawValue: raw) ?? .anytime
    }
}

public enum RoutineFreq: String, Codable, Sendable {
    case daily, weekly

    public init(from decoder: Decoder) throws {
        let raw = try decoder.singleValueContainer().decode(String.self)
        self = raw == "weekly" ? .weekly : .daily
    }
}

public struct RoutineSchedule: Codable, Equatable, Sendable {
    public var freq: RoutineFreq
    /// weekly 전용. 0=일 … 6=토
    public var weekdays: [Int]

    public init(freq: RoutineFreq, weekdays: [Int] = []) {
        self.freq = freq
        self.weekdays = weekdays
    }

    public static let daily = RoutineSchedule(freq: .daily)
}

/// 보관했다 다시 꺼낸 구간. 양 끝 포함. 이 날들은 예정일이 아니다.
public struct RoutinePause: Codable, Equatable, Sendable {
    public var from: String
    public var to: String

    public init(from: String, to: String) {
        self.from = from
        self.to = to
    }
}

public struct Routine: Codable, Identifiable, Equatable, Sendable {
    public var id: String
    public var title: String
    public var color: RoutineColor
    public var slot: RoutineSlot
    public var schedule: RoutineSchedule
    /// 하루 목표 시간(분). 채우면 자동 완료.
    public var goalMin: Int?
    /// YYYY-MM-DD. 이날부터 예정일을 센다.
    public var startDate: String
    /// YYYY-MM-DD. 보관한 날 — 이날부터 예정이 아니다.
    public var archivedAt: String?
    public var pauses: [RoutinePause]
    public var order: Int
    public var createdAt: String
    public var updatedAt: String

    public init(
        id: String,
        title: String,
        color: RoutineColor = .blue,
        slot: RoutineSlot = .anytime,
        schedule: RoutineSchedule = .daily,
        goalMin: Int? = nil,
        startDate: String,
        archivedAt: String? = nil,
        pauses: [RoutinePause] = [],
        order: Int = 0,
        createdAt: String,
        updatedAt: String
    ) {
        self.id = id
        self.title = title
        self.color = color
        self.slot = slot
        self.schedule = schedule
        self.goalMin = goalMin
        self.startDate = startDate
        self.archivedAt = archivedAt
        self.pauses = pauses
        self.order = order
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }

    public var isArchived: Bool { archivedAt != nil }
}

public struct RoutineSession: Codable, Equatable, Sendable {
    public var start: String
    public var end: String
    public var secs: Int

    public init(start: String, end: String, secs: Int) {
        self.start = start
        self.end = end
        self.secs = secs
    }
}

/// 루틴 × 날짜 한 줄.
public struct RoutineLog: Codable, Equatable, Sendable {
    public var routineId: String
    /// YYYY-MM-DD (로컬 날짜)
    public var date: String
    public var done: Bool
    public var doneAt: String?
    /// 그날 기록한 시간(초)
    public var secs: Int
    public var sessions: [RoutineSession]
    public var updatedAt: String

    public init(
        routineId: String,
        date: String,
        done: Bool = false,
        doneAt: String? = nil,
        secs: Int = 0,
        sessions: [RoutineSession] = [],
        updatedAt: String
    ) {
        self.routineId = routineId
        self.date = date
        self.done = done
        self.doneAt = doneAt
        self.secs = secs
        self.sessions = sessions
        self.updatedAt = updatedAt
    }

    /// `<routineId>:<date>` — 서버·맥과 같은 규칙.
    public var id: String { RoutineLog.id(routineId, date) }

    public static func id(_ routineId: String, _ date: String) -> String { "\(routineId):\(date)" }

    var isEmpty: Bool { !done && secs == 0 && sessions.isEmpty }
}

/// 돌고 있는 타이머. 한 번에 하나.
public struct RoutineTimer: Codable, Equatable, Sendable {
    public var routineId: String
    /// 시작한 로컬 날짜. 자정을 넘겨도 이 날짜에 기록.
    public var date: String
    /// RFC 3339 UTC
    public var startedAt: String

    public init(routineId: String, date: String, startedAt: String) {
        self.routineId = routineId
        self.date = date
        self.startedAt = startedAt
    }
}

/// 동기화 상태 — 서버로 보낼 것(고친 시각)과 받은 데까지의 번호.
public struct SyncState: Codable, Equatable, Sendable {
    public var cursor: Int = 0
    /// 루틴 id → 고친 시각
    public var dirtyRoutines: [String: String] = [:]
    /// 기록 id → 고친 시각
    public var dirtyLogs: [String: String] = [:]
    /// 타이머를 켜고 끈 시각
    public var dirtyTimer: String?
    /// 처음 연결 때 로컬 전부를 올릴 것으로 적었는가
    public var linked: Bool = false
    public var lastSyncAt: String?
    public var lastError: String?

    public init() {}

    enum CodingKeys: String, CodingKey {
        case cursor, dirtyRoutines, dirtyLogs, dirtyTimer, linked, lastSyncAt, lastError
    }

    /// 칸이 빠진 옛 파일도 읽는다 — 못 읽으면 루틴이 통째로 사라진 것처럼 보인다.
    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        cursor = try c.decodeIfPresent(Int.self, forKey: .cursor) ?? 0
        dirtyRoutines = try c.decodeIfPresent([String: String].self, forKey: .dirtyRoutines) ?? [:]
        dirtyLogs = try c.decodeIfPresent([String: String].self, forKey: .dirtyLogs) ?? [:]
        dirtyTimer = try c.decodeIfPresent(String.self, forKey: .dirtyTimer)
        linked = try c.decodeIfPresent(Bool.self, forKey: .linked) ?? false
        lastSyncAt = try c.decodeIfPresent(String.self, forKey: .lastSyncAt)
        lastError = try c.decodeIfPresent(String.self, forKey: .lastError)
    }

    public var pendingCount: Int { dirtyRoutines.count + dirtyLogs.count + (dirtyTimer == nil ? 0 : 1) }
}

/// 앱·위젯이 같이 쓰는 저장 단위. App Group 의 JSON 파일 하나.
public struct RoutineDB: Codable, Equatable, Sendable {
    public var routines: [Routine] = []
    /// 기록 id → 기록
    public var logs: [String: RoutineLog] = [:]
    public var timer: RoutineTimer?
    public var sync = SyncState()

    public init() {}

    enum CodingKeys: String, CodingKey { case routines, logs, timer, sync }

    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        routines = try c.decodeIfPresent([Routine].self, forKey: .routines) ?? []
        logs = try c.decodeIfPresent([String: RoutineLog].self, forKey: .logs) ?? [:]
        timer = try c.decodeIfPresent(RoutineTimer.self, forKey: .timer)
        sync = try c.decodeIfPresent(SyncState.self, forKey: .sync) ?? SyncState()
    }

    public func routine(_ id: String) -> Routine? { routines.first { $0.id == id } }

    public func log(_ routineId: String, _ date: String) -> RoutineLog? { logs[RoutineLog.id(routineId, date)] }

    /// 보관하지 않은 것, 순서대로.
    public var activeRoutines: [Routine] { sortedRoutines.filter { !$0.isArchived } }

    public var sortedRoutines: [Routine] {
        routines.sorted { a, b in a.order != b.order ? a.order < b.order : a.createdAt < b.createdAt }
    }

    public var earliestStart: String? { routines.map(\.startDate).min() }
}
