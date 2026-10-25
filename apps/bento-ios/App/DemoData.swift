import Foundation
import RoutineKit

#if DEBUG
/// CI 스크린샷용 예시 데이터. 디버그 빌드에서 `-BentoDemo` 인자로 켤 때만 쓰인다.
///   -BentoDemo           예시 루틴 6개 · 120일 기록 · 도는 타이머
///   -BentoTab <탭>       today | stats | routines | settings
///   -BentoScroll <칸>    기록 탭에서 처음 보일 칸 (heatmap | period | pattern | rows)
///   -BentoSheet edit     첫 루틴 편집 화면을 띄운 채로 시작
enum DemoData {
    static var args: [String] { ProcessInfo.processInfo.arguments }
    static var isOn: Bool { args.contains("-BentoDemo") }

    static func value(_ key: String) -> String? {
        guard let i = args.firstIndex(of: key), i + 1 < args.count else { return nil }
        return args[i + 1]
    }

    static var tab: AppTab? {
        switch value("-BentoTab") {
        case "stats": return .stats
        case "routines": return .routines
        case "settings": return .settings
        case "today": return .today
        default: return nil
        }
    }

    static var scroll: String? { value("-BentoScroll") }
    static var sheet: String? { value("-BentoSheet") }

    static func make(today: String, now: Date = Date()) -> RoutineDB {
        var db = RoutineDB()
        let start = DayKey.add(today, -120)
        let stamp = Clock.iso(now)
        let specs: [(String, RoutineColor, RoutineSlot, RoutineSchedule, Int?, Double)] = [
            ("물 한 잔", .aqua, .morning, .daily, nil, 0.93),
            ("스트레칭", .orange, .morning, .daily, 10, 0.78),
            ("운동", .magenta, .afternoon, RoutineSchedule(freq: .weekly, weekdays: [1, 3, 5]), 40, 0.7),
            ("독서", .violet, .evening, .daily, 30, 0.72),
            ("명상", .blue, .anytime, .daily, 10, 0.55),
            ("일기", .yellow, .evening, .daily, nil, 0.62),
        ]
        for (i, s) in specs.enumerated() {
            db.routines.append(Routine(
                id: "demo\(i)", title: s.0, color: s.1, slot: s.2, schedule: s.3, goalMin: s.4,
                startDate: start, order: i, createdAt: stamp, updatedAt: stamp
            ))
        }
        // 보관한 루틴 하나
        db.routines.append(Routine(
            id: "demo-old", title: "영어 단어", color: .blue, slot: .morning, goalMin: 15,
            startDate: start, archivedAt: DayKey.add(today, -40), order: 9, createdAt: stamp, updatedAt: stamp
        ))

        var seed: UInt64 = 0x5EED
        func rnd() -> Double {
            seed = seed &* 6_364_136_223_846_793_005 &+ 1_442_695_040_888_963_407
            return Double(seed >> 11) / Double(UInt64(1) << 53)
        }
        let rates = Dictionary(uniqueKeysWithValues: specs.enumerated().map { ("demo\($0.offset)", $0.element.5) })
        for d in DayKey.range(start, today) {
            let dow = DayKey.weekday(d)
            let weekend = dow == 0 || dow == 6
            // 최근으로 올수록 조금 나아지는 흐름
            let trend = Double(DayKey.between(start, d)) / 120 * 0.12
            for r in db.routines where RoutineStats.isScheduled(r, on: d) {
                var p = (rates[r.id] ?? 0.6) + trend - (weekend ? 0.18 : 0)
                if r.id == "demo-old" { p = 0.5 }
                if d == today {
                    // 오늘은 아침 것만 끝낸 상태
                    p = r.slot == .morning ? 1 : 0
                }
                guard rnd() < p else { continue }
                let secs = r.goalMin.map { Int(Double($0 * 60) * (0.85 + rnd() * 0.5)) } ?? 0
                db.logs[RoutineLog.id(r.id, d)] = RoutineLog(
                    routineId: r.id, date: d, done: true, doneAt: stamp, secs: secs, updatedAt: stamp
                )
            }
        }
        // 오늘 독서 12분째
        db.logs[RoutineLog.id("demo3", today)] = RoutineLog(routineId: "demo3", date: today, done: false, secs: 6 * 60, updatedAt: stamp)
        db.timer = RoutineTimer(routineId: "demo3", date: today, startedAt: Clock.iso(now.addingTimeInterval(-6 * 60 - 14)))
        db.sync.linked = true
        db.sync.lastSyncAt = Clock.iso(now.addingTimeInterval(-90))
        return db
    }
}
#endif
