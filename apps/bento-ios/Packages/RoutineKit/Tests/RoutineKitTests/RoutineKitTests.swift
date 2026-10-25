import XCTest
@testable import RoutineKit

let NOW = Clock.parse("2026-10-25T03:00:00.000Z")!

func routine(_ id: String, start: String = "2026-10-01", schedule: RoutineSchedule = .daily, goal: Int? = nil, title: String? = nil, slot: RoutineSlot = .anytime) -> Routine {
    Routine(id: id, title: title ?? id, slot: slot, schedule: schedule, goalMin: goal, startDate: start, createdAt: "2026-10-01T00:00:00.000Z", updatedAt: "2026-10-01T00:00:00.000Z")
}

func done(_ db: inout RoutineDB, _ id: String, _ date: String, secs: Int = 0) {
    db.logs[RoutineLog.id(id, date)] = RoutineLog(routineId: id, date: date, done: true, secs: secs, updatedAt: "2026-10-01T00:00:00.000Z")
}

final class DatesTests: XCTestCase {
    func testDayKeys() {
        XCTAssertEqual(DayKey.add("2026-10-31", 1), "2026-11-01")
        XCTAssertEqual(DayKey.add("2026-03-01", -1), "2026-02-28")
        XCTAssertEqual(DayKey.between("2026-10-01", "2026-10-25"), 24)
        XCTAssertEqual(DayKey.weekday("2026-10-25"), 0)
        XCTAssertEqual(DayKey.range("2026-10-30", "2026-11-02"), ["2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02"])
        XCTAssertEqual(DayKey.range("2026-10-02", "2026-10-01"), [])
        XCTAssertEqual(DayKey.weekStart("2026-10-25", mondayFirst: true), "2026-10-19")
        XCTAssertEqual(DayKey.weekStart("2026-10-25", mondayFirst: false), "2026-10-25")
        XCTAssertEqual(DayKey.monthEnd("2026-02-10"), "2026-02-28")
        XCTAssertEqual(DayKey.monthEnd("2028-02-10"), "2028-02-29")
        XCTAssertEqual(DayKey.monthEnd("2026-12-03"), "2026-12-31")
        XCTAssertTrue(DayKey.isValid("2026-02-28"))
        XCTAssertFalse(DayKey.isValid("2026-02-30"))
        XCTAssertFalse(DayKey.isValid("10/25"))
        XCTAssertEqual(DayKey.label("2026-10-25"), "10월 25일 (일)")
    }

    func testClockReadsBothForms() {
        XCTAssertNotNil(Clock.parse("2026-10-25T00:00:00Z"))
        XCTAssertNotNil(Clock.parse("2026-10-25T00:00:00.123Z"))
        XCTAssertTrue(Clock.isAfter("2026-10-25T00:00:01Z", "2026-10-25T00:00:00.999Z"))
        XCTAssertFalse(Clock.isAfter("nope", Clock.epoch))
    }
}

final class EngineTests: XCTestCase {
    func testNormalize() throws {
        let ok = try RoutineEngine.normalize(RoutineInput(title: "  물 2L ", schedule: RoutineSchedule(freq: .weekly, weekdays: [5, 1, 3, 1]), goalMin: 0, startDate: "2026-10-20"))
        XCTAssertEqual(ok.title, "물 2L")
        XCTAssertEqual(ok.schedule.weekdays, [1, 3, 5])
        XCTAssertNil(ok.goalMin)
        let all = try RoutineEngine.normalize(RoutineInput(title: "일기", schedule: RoutineSchedule(freq: .weekly, weekdays: [0, 1, 2, 3, 4, 5, 6]), startDate: "2026-10-20"))
        XCTAssertEqual(all.schedule, .daily)
        XCTAssertThrowsError(try RoutineEngine.normalize(RoutineInput(title: "  ", startDate: "2026-10-20")))
        XCTAssertThrowsError(try RoutineEngine.normalize(RoutineInput(title: String(repeating: "가", count: 61), startDate: "2026-10-20")))
        XCTAssertThrowsError(try RoutineEngine.normalize(RoutineInput(title: "a", schedule: RoutineSchedule(freq: .weekly, weekdays: []), startDate: "2026-10-20")))
        XCTAssertThrowsError(try RoutineEngine.normalize(RoutineInput(title: "a", schedule: RoutineSchedule(freq: .weekly, weekdays: [7]), startDate: "2026-10-20")))
        XCTAssertThrowsError(try RoutineEngine.normalize(RoutineInput(title: "a", goalMin: 601, startDate: "2026-10-20")))
        XCTAssertThrowsError(try RoutineEngine.normalize(RoutineInput(title: "a", startDate: "2026-13-01")))
    }

    func testAddMarksDirtyAndOrders() throws {
        var db = RoutineDB()
        let a = try RoutineEngine.add(RoutineInput(title: "a", startDate: "2026-10-01"), to: &db, now: NOW)
        let b = try RoutineEngine.add(RoutineInput(title: "b", startDate: "2026-10-01"), to: &db, now: NOW)
        XCTAssertTrue(a.id.hasPrefix("rt_"))
        XCTAssertEqual([a.order, b.order], [0, 1])
        XCTAssertEqual(db.sync.dirtyRoutines.count, 2)
        RoutineEngine.reorder([b.id, a.id], in: &db, now: NOW)
        XCTAssertEqual(db.sortedRoutines.map(\.id), [b.id, a.id])
    }

    func testCheckRulesAndPrune() throws {
        var db = RoutineDB()
        db.routines = [routine("r1")]
        let l = try RoutineEngine.check("r1", date: "2026-10-25", done: true, in: &db, now: NOW, today: "2026-10-25")
        XCTAssertTrue(l.done)
        XCTAssertNotNil(l.doneAt)
        XCTAssertEqual(db.sync.dirtyLogs["r1:2026-10-25"], Clock.iso(NOW))
        try RoutineEngine.check("r1", date: "2026-10-25", done: false, in: &db, now: NOW, today: "2026-10-25")
        XCTAssertNil(db.log("r1", "2026-10-25"), "빈 기록은 남기지 않는다")
        XCTAssertNotNil(db.sync.dirtyLogs["r1:2026-10-25"], "지운 것도 보낸다")
        XCTAssertThrowsError(try RoutineEngine.check("r1", date: "2026-10-26", done: true, in: &db, now: NOW, today: "2026-10-25"))
        XCTAssertThrowsError(try RoutineEngine.check("r1", date: "2026-09-30", done: true, in: &db, now: NOW, today: "2026-10-25"))
        XCTAssertThrowsError(try RoutineEngine.check("nope", date: "2026-10-25", done: true, in: &db, now: NOW, today: "2026-10-25"))
    }

    func testMinutesReachGoal() throws {
        var db = RoutineDB()
        db.routines = [routine("r1", goal: 30)]
        var r = try RoutineEngine.setMinutes("r1", date: "2026-10-25", minutes: 20, in: &db, now: NOW, today: "2026-10-25")
        XCTAssertFalse(r.reachedGoal)
        r = try RoutineEngine.setMinutes("r1", date: "2026-10-25", minutes: 30, in: &db, now: NOW, today: "2026-10-25")
        XCTAssertTrue(r.reachedGoal && r.log.done)
        r = try RoutineEngine.setMinutes("r1", date: "2026-10-25", minutes: 5, in: &db, now: NOW, today: "2026-10-25")
        XCTAssertTrue(r.log.done, "시간을 줄여도 완료는 그대로")
    }

    func testTimerLifecycle() throws {
        var db = RoutineDB()
        db.routines = [routine("r1", goal: 10), routine("r2")]
        XCTAssertNil(try RoutineEngine.startTimer("r1", in: &db, now: NOW, today: "2026-10-25"))
        XCTAssertEqual(db.timer?.routineId, "r1")
        XCTAssertNil(try RoutineEngine.startTimer("r1", in: &db, now: NOW.addingTimeInterval(60), today: "2026-10-25"), "같은 루틴이면 그대로")
        let c = try RoutineEngine.startTimer("r2", in: &db, now: NOW.addingTimeInterval(12 * 60), today: "2026-10-25")
        XCTAssertEqual(c?.addedSecs, 720)
        XCTAssertEqual(c?.reachedGoal, true)
        XCTAssertEqual(db.timer?.routineId, "r2")
        XCTAssertNil(RoutineEngine.stopTimer(in: &db, now: NOW.addingTimeInterval(13 * 60), discard: true))
        XCTAssertNil(db.timer)
        XCTAssertNil(db.log("r2", "2026-10-25"))
        XCTAssertNotNil(db.sync.dirtyTimer)
    }

    func testForgottenTimerIsCapped() throws {
        var db = RoutineDB()
        db.routines = [routine("r1")]
        try RoutineEngine.startTimer("r1", in: &db, now: NOW, today: "2026-10-25")
        let c = RoutineEngine.stopTimer(in: &db, now: NOW.addingTimeInterval(30 * 3600))
        XCTAssertEqual(c?.capped, true)
        XCTAssertEqual(c?.addedSecs, RoutineEngine.maxSessionSecs)
        XCTAssertEqual(c?.log.date, "2026-10-25", "시작한 날짜에 기록")
    }

    func testArchiveAndUnarchiveLeavePause() throws {
        var db = RoutineDB()
        db.routines = [routine("r1")]
        try RoutineEngine.startTimer("r1", in: &db, now: NOW, today: "2026-10-10")
        try RoutineEngine.setArchived("r1", true, in: &db, now: NOW.addingTimeInterval(600), today: "2026-10-10")
        XCTAssertNil(db.timer, "보관하면 타이머를 멈춘다")
        XCTAssertEqual(db.log("r1", "2026-10-10")?.secs, 600)
        XCTAssertThrowsError(try RoutineEngine.startTimer("r1", in: &db, now: NOW, today: "2026-10-10"))
        try RoutineEngine.setArchived("r1", false, in: &db, now: NOW, today: "2026-10-20")
        XCTAssertNil(db.routine("r1")?.archivedAt)
        XCTAssertEqual(db.routine("r1")?.pauses, [RoutinePause(from: "2026-10-10", to: "2026-10-19")])
    }

    func testDeleteDropsLogsAndTimer() throws {
        var db = RoutineDB()
        db.routines = [routine("r1"), routine("r2")]
        try RoutineEngine.check("r1", date: "2026-10-24", done: true, in: &db, now: NOW, today: "2026-10-25")
        try RoutineEngine.check("r2", date: "2026-10-24", done: true, in: &db, now: NOW, today: "2026-10-25")
        try RoutineEngine.startTimer("r1", in: &db, now: NOW, today: "2026-10-25")
        try RoutineEngine.delete("r1", in: &db, now: NOW)
        XCTAssertNil(db.routine("r1"))
        XCTAssertNil(db.log("r1", "2026-10-24"))
        XCTAssertNotNil(db.log("r2", "2026-10-24"))
        XCTAssertNil(db.timer)
        XCTAssertNil(db.sync.dirtyLogs["r1:2026-10-24"], "서버가 따라 지우므로 기록은 따로 안 보낸다")
        XCTAssertNotNil(db.sync.dirtyRoutines["r1"])
    }

    func testStoreRoundTripAndTolerantDecode() throws {
        let dir = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        let store = RoutineFileStore(url: dir.appendingPathComponent("routines.json"))
        var db = RoutineDB()
        db.routines = [routine("r1", schedule: RoutineSchedule(freq: .weekly, weekdays: [1, 3]))]
        done(&db, "r1", "2026-10-19", secs: 90)
        db.timer = RoutineTimer(routineId: "r1", date: "2026-10-25", startedAt: Clock.iso(NOW))
        db.sync.cursor = 42
        try store.save(db)
        XCTAssertEqual(store.load(), db)
        let old = #"{"routines":[],"logs":{}}"#.data(using: .utf8)!
        XCTAssertEqual(try JSONDecoder().decode(RoutineDB.self, from: old).sync.cursor, 0)
        try? FileManager.default.removeItem(at: dir)
    }
}

final class StatsTests: XCTestCase {
    func testScheduledArchivePause() {
        var r = routine("r", schedule: RoutineSchedule(freq: .weekly, weekdays: [1, 3, 5]))
        r.archivedAt = "2026-10-30"
        r.pauses = [RoutinePause(from: "2026-10-12", to: "2026-10-18")]
        XCTAssertFalse(RoutineStats.isScheduled(r, on: "2026-09-28"))
        XCTAssertTrue(RoutineStats.isScheduled(r, on: "2026-10-05"))
        XCTAssertFalse(RoutineStats.isScheduled(r, on: "2026-10-06"))
        XCTAssertFalse(RoutineStats.isScheduled(r, on: "2026-10-12"))
        XCTAssertTrue(RoutineStats.isScheduled(r, on: "2026-10-19"))
        XCTAssertFalse(RoutineStats.isScheduled(r, on: "2026-10-30"))
    }

    func testStreak() {
        let r = routine("r", schedule: RoutineSchedule(freq: .weekly, weekdays: [1, 3, 5]))
        var db = RoutineDB()
        db.routines = [r]
        for d in ["2026-10-19", "2026-10-21", "2026-10-23", "2026-10-24"] { done(&db, "r", d) }
        let s = RoutineStats.streak(r, db, today: "2026-10-26")
        XCTAssertEqual(s.current, 3)
        XCTAssertTrue(s.pendingToday)
        XCTAssertEqual(RoutineStats.streak(r, db, today: "2026-10-28").current, 0)
        XCTAssertEqual(RoutineStats.cell(r, db, "2026-10-24", today: "2026-10-28"), .extra)
        XCTAssertEqual(RoutineStats.cell(r, db, "2026-10-26", today: "2026-10-28"), .missed)
        XCTAssertEqual(RoutineStats.cell(r, db, "2026-10-28", today: "2026-10-28"), .pending)
        XCTAssertEqual(RoutineStats.cell(r, db, "2026-10-27", today: "2026-10-28"), .off)
    }

    func testSummaryAndPerfectStreak() {
        let a = routine("a")
        let b = routine("b", schedule: RoutineSchedule(freq: .weekly, weekdays: [0, 6]))
        var db = RoutineDB()
        db.routines = [a, b]
        done(&db, "a", "2026-10-24", secs: 600)
        done(&db, "b", "2026-10-24")
        done(&db, "a", "2026-10-25", secs: 300)
        done(&db, "b", "2026-10-23")
        let sum = RoutineStats.summarize([a, b], db, from: "2026-10-23", to: "2026-10-27", today: "2026-10-25")
        XCTAssertEqual(sum.days.count, 5)
        XCTAssertEqual(sum.scheduled, 5)
        XCTAssertEqual(sum.done, 3)
        XCTAssertEqual(sum.secs, 900)
        XCTAssertEqual(sum.perfectDays, 1)
        XCTAssertEqual(sum.activeDays, 3)
        let p = RoutineStats.perfectStreak([a, b], db, today: "2026-10-25")
        XCTAssertEqual(p.current, 1)
        XCTAssertEqual(p.best, 1)
    }

    func testRowsAndInsights() {
        let today = "2026-10-25"
        let read = routine("read", start: "2026-08-01", title: "독서")
        let gym = routine("gym", start: "2026-08-01", title: "운동", slot: .evening)
        var db = RoutineDB()
        db.routines = [read, gym]
        for d in DayKey.range("2026-08-01", today) {
            if d >= "2026-10-10" || DayKey.weekday(d) != 3 { done(&db, "read", d, secs: 1200) }
            if (DayKey.weekday(d) == 1 || DayKey.weekday(d) == 4) && d < "2026-10-19" { done(&db, "gym", d) }
        }
        let rows = RoutineStats.rows([read, gym], db, today: today)
        XCTAssertEqual(rows.first?.recent.count, 14)
        let ids = RoutineStats.insights([read, gym], db, today: today, mondayFirst: true).map(\.id)
        XCTAssertTrue(ids.contains("record-read"), "\(ids)")
        XCTAssertTrue(ids.contains("struggle-gym"), "\(ids)")
        XCTAssertTrue(ids.contains("time-top"), "\(ids)")
        XCTAssertLessThanOrEqual(ids.count, 5)
        XCTAssertEqual(RoutineStats.insights([], db, today: today, mondayFirst: true), [])
    }

    func testFormatting() {
        XCTAssertEqual(RoutineStats.formatSecs(59), "0분")
        XCTAssertEqual(RoutineStats.formatSecs(45 * 60), "45분")
        XCTAssertEqual(RoutineStats.formatSecs(3 * 3600 + 600), "3시간 10분")
        XCTAssertEqual(RoutineStats.formatClock(65), "01:05")
        XCTAssertEqual(RoutineStats.formatClock(3725), "1:02:05")
        XCTAssertEqual(RoutineStats.describe(RoutineSchedule(freq: .weekly, weekdays: [5, 1, 2, 3, 4])), "평일")
        XCTAssertEqual(RoutineStats.describe(RoutineSchedule(freq: .weekly, weekdays: [6, 0])), "주말")
        XCTAssertEqual(RoutineStats.describe(RoutineSchedule(freq: .weekly, weekdays: [0, 3, 1])), "월·수·일")
        XCTAssertEqual(RoutineStats.pct(nil), "–")
        XCTAssertEqual(RoutineStats.pct(0.666), "67%")
    }
}
