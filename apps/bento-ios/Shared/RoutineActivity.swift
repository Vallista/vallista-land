import ActivityKit
import AppIntents
import Foundation
import RoutineKit
import WidgetKit

/// 잠금화면·다이내믹 아일랜드의 타이머.
struct RoutineActivityAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable {
        var startedAt: Date
        /// 이 타이머 전에 그날 이미 쌓인 초 — 표시는 그날 합계로
        var baseSecs: Int
        var goalSecs: Int?
    }

    var routineId: String
    var title: String
    var color: String
}

/// 위젯에서 바로 체크 — 위젯 프로세스에서 돈다. 서버로는 앱이 열릴 때 올라간다.
struct ToggleRoutineIntent: AppIntent {
    static let title: LocalizedStringResource = "루틴 체크"
    static let isDiscoverable = false

    @Parameter(title: "루틴")
    var routineId: String

    init() {}

    init(routineId: String) {
        self.routineId = routineId
    }

    func perform() async throws -> some IntentResult {
        let store = AppConfig.store
        var db = store.load()
        let today = AppConfig.today()
        let done = db.log(routineId, today)?.done == true
        _ = try? RoutineEngine.check(routineId, date: today, done: !done, in: &db, now: Date(), today: today)
        try store.save(db)
        await MainActor.run { NotificationCenter.default.post(name: .routineStoreChanged, object: nil) }
        return .result()
    }
}

/// 잠금화면 타이머의 ■ — 앱 프로세스에서 돈다(LiveActivityIntent).
struct StopRoutineTimerIntent: LiveActivityIntent {
    static let title: LocalizedStringResource = "타이머 멈추기"
    static let isDiscoverable = false

    init() {}

    func perform() async throws -> some IntentResult {
        let store = AppConfig.store
        var db = store.load()
        _ = RoutineEngine.stopTimer(in: &db, now: Date())
        try store.save(db)
        for activity in Activity<RoutineActivityAttributes>.activities {
            await activity.end(nil, dismissalPolicy: .immediate)
        }
        WidgetCenter.shared.reloadAllTimelines()
        await MainActor.run { NotificationCenter.default.post(name: .routineStoreChanged, object: nil) }
        return .result()
    }
}
