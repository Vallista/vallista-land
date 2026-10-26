import XCTest
@testable import RoutineKit

/// 도란 서버의 루틴 규칙을 흉내 낸다 (packages/db/src/queries/routines.ts 와 같은 판정).
actor FakeServer: RoutineTransport {
    var routines: [String: ServerRoutine] = [:]
    var logs: [String: ServerLog] = [:]
    var timer: ServerTimer?
    var rev = 0
    var clock: Date

    init(now: Date) { clock = now }

    func advance(_ secs: TimeInterval) { clock = clock.addingTimeInterval(secs) }

    func next() -> Int {
        rev += 1
        return rev
    }

    func clamp(_ iso: String) -> String {
        guard let d = Clock.parse(iso) else { return iso }
        return Clock.iso(min(d, clock))
    }

    func pull(since: Int) async throws -> ChangesResponse {
        let rs = routines.values.filter { $0.rev > since }.sorted { $0.rev < $1.rev }
        let ls = logs.values.filter { $0.rev > since }.sorted { $0.rev < $1.rev }
        let t = (timer?.rev ?? 0) > since ? timer : nil
        let cursor = ([since] + rs.map(\.rev) + ls.map(\.rev) + [t?.rev ?? 0]).max() ?? since
        return ChangesResponse(routines: rs, logs: ls, timer: t, cursor: cursor, more: false)
    }

    func push(_ body: PushBody) async throws -> PushResponse {
        var applied = 0
        var stale: [String] = []
        var current = PushResponse.Current(routines: [], logs: [], timer: nil)
        for p in body.routines {
            let at = clamp(p.updatedAt)
            if let ex = routines[p.id], Clock.isAfter(ex.updatedAt, at) {
                stale.append(p.id)
                current.routines.append(ex)
                continue
            }
            if let r = p.routine {
                routines[p.id] = ServerRoutine(
                    id: r.id, title: r.title, color: r.color, slot: r.slot, schedule: r.schedule, goalMin: r.goalMin,
                    startDate: r.startDate, archivedAt: r.archivedAt, pauses: r.pauses, order: r.order,
                    createdAt: r.createdAt, deleted: false, updatedAt: at, rev: next()
                )
            } else if var ex = routines[p.id], !ex.deleted {
                ex.deleted = true
                ex.updatedAt = at
                ex.rev = next()
                routines[p.id] = ex
                for (id, original) in logs where original.routineId == p.id && !original.deleted {
                    var l = original
                    l.deleted = true
                    l.updatedAt = at
                    l.rev = next()
                    logs[id] = l
                }
                if timer?.routineId == p.id { timer = ServerTimer(routineId: nil, date: nil, startedAt: nil, updatedAt: at, rev: next()) }
            } else {
                continue
            }
            applied += 1
        }
        for p in body.logs {
            let id = RoutineLog.id(p.routineId, p.date)
            let at = clamp(p.updatedAt)
            if let ex = logs[id], Clock.isAfter(ex.updatedAt, at) {
                stale.append(id)
                current.logs.append(ex)
                continue
            }
            if let l = p.log {
                logs[id] = ServerLog(id: id, routineId: l.routineId, date: l.date, done: l.done, doneAt: l.doneAt, secs: l.secs, sessions: l.sessions, deleted: false, updatedAt: at, rev: next())
            } else if var ex = logs[id], !ex.deleted {
                ex.deleted = true
                ex.updatedAt = at
                ex.rev = next()
                logs[id] = ex
            } else {
                continue
            }
            applied += 1
        }
        if let t = body.timer {
            let at = clamp(t.updatedAt)
            if let ex = timer, Clock.isAfter(ex.updatedAt, at) {
                stale.append("timer")
                current.timer = ex
            } else {
                timer = ServerTimer(routineId: t.timer?.routineId, date: t.timer?.date, startedAt: t.timer?.startedAt, updatedAt: at, rev: next())
                applied += 1
            }
        }
        return PushResponse(applied: applied, stale: stale, rejected: [], current: current)
    }
}

@MainActor
final class Device: RoutineDBHolder {
    var db = RoutineDB()
    var saves = 0
    func persist() { saves += 1 }
}

@MainActor
final class SyncTests: XCTestCase {
    let today = "2026-10-25"

    func testTwoDevicesConverge() async throws {
        let server = FakeServer(now: NOW.addingTimeInterval(3600))
        let mac = Device()
        let phone = Device()

        let r = try RoutineEngine.add(RoutineInput(title: "독서", goalMin: 20, startDate: "2026-10-01"), to: &mac.db, now: NOW)
        try RoutineEngine.check(r.id, date: "2026-10-24", done: true, in: &mac.db, now: NOW, today: today)
        try await RoutineSync.run(mac, transport: server)
        XCTAssertEqual(mac.db.sync.pendingCount, 0)

        let pulled = try await RoutineSync.run(phone, transport: server)
        XCTAssertEqual(pulled.pulled, 2)
        XCTAssertEqual(phone.db.routine(r.id)?.title, "독서")
        XCTAssertEqual(phone.db.log(r.id, "2026-10-24")?.done, true)

        // 폰에서 타이머를 켜면 맥에 보인다
        try RoutineEngine.startTimer(r.id, in: &phone.db, now: NOW.addingTimeInterval(60), today: today)
        try await RoutineSync.run(phone, transport: server)
        try await RoutineSync.run(mac, transport: server)
        XCTAssertEqual(mac.db.timer?.routineId, r.id)

        // 맥에서 멈추면 기록이 폰에 간다
        let c = RoutineEngine.stopTimer(in: &mac.db, now: NOW.addingTimeInterval(60 + 25 * 60))
        XCTAssertEqual(c?.reachedGoal, true)
        try await RoutineSync.run(mac, transport: server)
        try await RoutineSync.run(phone, transport: server)
        XCTAssertNil(phone.db.timer)
        XCTAssertEqual(phone.db.log(r.id, today)?.done, true)
        XCTAssertEqual(phone.db.log(r.id, today)?.secs, 25 * 60)
    }

    func testLaterEditWinsAndStaleIsOverwritten() async throws {
        let server = FakeServer(now: NOW.addingTimeInterval(3600))
        let mac = Device()
        let phone = Device()
        let r = try RoutineEngine.add(RoutineInput(title: "명상", startDate: "2026-10-01"), to: &mac.db, now: NOW)
        try await RoutineSync.run(mac, transport: server)
        try await RoutineSync.run(phone, transport: server)

        // 둘 다 오프라인에서 이름을 바꿈 — 폰이 나중
        try RoutineEngine.update(r.id, RoutineInput(title: "명상 (맥)", startDate: "2026-10-01"), in: &mac.db, now: NOW.addingTimeInterval(100))
        try RoutineEngine.update(r.id, RoutineInput(title: "명상 (폰)", startDate: "2026-10-01"), in: &phone.db, now: NOW.addingTimeInterval(200))
        try await RoutineSync.run(phone, transport: server)
        let report = try await RoutineSync.run(mac, transport: server)
        XCTAssertEqual(report.stale, 1, "맥 것은 더 이르니 버려진다")
        XCTAssertEqual(mac.db.routine(r.id)?.title, "명상 (폰)", "버려진 것은 서버 값으로 곧바로 덮는다")
        XCTAssertEqual(mac.db.sync.pendingCount, 0)
    }

    func testPendingLocalEditIsNotOverwrittenByOlderPull() async throws {
        let server = FakeServer(now: NOW.addingTimeInterval(3600))
        let mac = Device()
        let phone = Device()
        let r = try RoutineEngine.add(RoutineInput(title: "a", startDate: "2026-10-01"), to: &mac.db, now: NOW)
        try await RoutineSync.run(mac, transport: server)
        try await RoutineSync.run(phone, transport: server)
        try RoutineEngine.update(r.id, RoutineInput(title: "맥 옛 수정", startDate: "2026-10-01"), in: &mac.db, now: NOW.addingTimeInterval(10))
        try await RoutineSync.run(mac, transport: server)
        try RoutineEngine.update(r.id, RoutineInput(title: "폰 새 수정", startDate: "2026-10-01"), in: &phone.db, now: NOW.addingTimeInterval(20))
        // 폰의 받기만 먼저 — 서버 것(10초)이 폰 것(20초)보다 이르니 덮지 않는다
        let changes = try await server.pull(since: phone.db.sync.cursor)
        RoutineSync.applyPull(changes, to: &phone.db)
        XCTAssertEqual(phone.db.routine(r.id)?.title, "폰 새 수정")
        try await RoutineSync.run(phone, transport: server)
        try await RoutineSync.run(mac, transport: server)
        XCTAssertEqual(mac.db.routine(r.id)?.title, "폰 새 수정")
    }

    func testDeleteCascadesToOtherDevice() async throws {
        let server = FakeServer(now: NOW.addingTimeInterval(3600))
        let mac = Device()
        let phone = Device()
        let r = try RoutineEngine.add(RoutineInput(title: "운동", startDate: "2026-10-01"), to: &mac.db, now: NOW)
        try RoutineEngine.check(r.id, date: "2026-10-20", done: true, in: &mac.db, now: NOW, today: today)
        try RoutineEngine.check(r.id, date: "2026-10-21", done: true, in: &mac.db, now: NOW, today: today)
        try await RoutineSync.run(mac, transport: server)
        try await RoutineSync.run(phone, transport: server)
        XCTAssertEqual(phone.db.logs.count, 2)
        try RoutineEngine.delete(r.id, in: &mac.db, now: NOW.addingTimeInterval(30))
        try await RoutineSync.run(mac, transport: server)
        try await RoutineSync.run(phone, transport: server)
        XCTAssertNil(phone.db.routine(r.id))
        XCTAssertTrue(phone.db.logs.isEmpty)
    }

    func testFirstLinkLetsServerWin() async throws {
        let server = FakeServer(now: NOW.addingTimeInterval(3600))
        let mac = Device()
        let phone = Device()
        let r = try RoutineEngine.add(RoutineInput(title: "서버 이름", startDate: "2026-10-01"), to: &mac.db, now: NOW)
        try await RoutineSync.run(mac, transport: server)
        // 폰이 연결 전에 같은 id 를 다른 이름으로 들고 있었다(복원 등) + 서버에 없는 것도 하나
        var local = mac.db.routine(r.id)!
        local.title = "폰 옛 이름"
        phone.db.routines = [local, routine("only-phone")]
        phone.db.sync = SyncState()
        try await RoutineSync.run(phone, transport: server)
        XCTAssertTrue(phone.db.sync.linked)
        XCTAssertEqual(phone.db.routine(r.id)?.title, "서버 이름", "처음 연결은 서버가 이긴다")
        try await RoutineSync.run(mac, transport: server)
        XCTAssertNotNil(mac.db.routine("only-phone"), "서버에 없던 것은 올라간다")
    }

    func testUncheckDeletesLogOnOtherDevice() async throws {
        let server = FakeServer(now: NOW.addingTimeInterval(3600))
        let mac = Device()
        let phone = Device()
        let r = try RoutineEngine.add(RoutineInput(title: "물", startDate: "2026-10-01"), to: &mac.db, now: NOW)
        try RoutineEngine.check(r.id, date: today, done: true, in: &mac.db, now: NOW, today: today)
        try await RoutineSync.run(mac, transport: server)
        try await RoutineSync.run(phone, transport: server)
        try RoutineEngine.check(r.id, date: today, done: false, in: &phone.db, now: NOW.addingTimeInterval(60), today: today)
        try await RoutineSync.run(phone, transport: server)
        try await RoutineSync.run(mac, transport: server)
        XCTAssertNil(mac.db.log(r.id, today))
    }

    func testEditDuringPushStaysPending() async throws {
        var db = RoutineDB()
        db.routines = [routine("r1")]
        db.sync.linked = true
        try RoutineEngine.check("r1", date: today, done: true, in: &db, now: NOW, today: today)
        let out = RoutineSync.outgoing(db)
        // 보내는 사이에 다시 고침
        try RoutineEngine.check("r1", date: today, done: false, in: &db, now: NOW.addingTimeInterval(1), today: today)
        RoutineSync.applyPushResult(PushResponse(applied: 1, stale: [], rejected: [], current: .init(routines: [], logs: [], timer: nil)), sent: out, to: &db)
        XCTAssertNotNil(db.sync.dirtyLogs["r1:\(today)"], "보낸 뒤에 고친 것은 남는다")
    }

    func testPushEncodingSendsExplicitNulls() throws {
        var r = routine("r1")
        r.goalMin = nil
        let body = PushBody(
            routines: [PushRoutine(id: "r1", updatedAt: Clock.epoch, routine: r), PushRoutine(id: "gone", updatedAt: Clock.epoch, routine: nil)],
            logs: [PushLog(routineId: "r1", date: today, updatedAt: Clock.epoch, log: nil)],
            timer: PushTimer(timer: nil, updatedAt: Clock.epoch)
        )
        let json = try JSONSerialization.jsonObject(with: JSONEncoder().encode(body)) as? [String: Any]
        let routines = json?["routines"] as? [[String: Any]]
        XCTAssertTrue(routines?[0]["goalMin"] is NSNull, "비운 목표는 null 로 — 빠지면 서버가 그대로 둔다")
        XCTAssertTrue(routines?[0]["archivedAt"] is NSNull)
        XCTAssertEqual(routines?[1]["deleted"] as? Bool, true)
        XCTAssertNil(routines?[1]["title"])
        let logs = json?["logs"] as? [[String: Any]]
        XCTAssertEqual(logs?[0]["deleted"] as? Bool, true)
        XCTAssertEqual(logs?[0]["date"] as? String, today)
        let timer = json?["timer"] as? [String: Any]
        XCTAssertTrue(timer?["routineId"] is NSNull)
    }

    func testDecodesServerResponse() throws {
        let raw = """
        {"routines":[{"id":"rt_http","title":"HTTP 루틴","color":"aqua","slot":"morning","schedule":{"freq":"daily","weekdays":[]},"goalMin":null,"startDate":"2026-10-20","archivedAt":null,"pauses":[],"order":0,"createdAt":"2026-10-20T00:00:00.000Z","deleted":false,"updatedAt":"2026-10-25T00:00:00.000Z","rev":29}],"logs":[{"id":"rt_http:2026-10-25","routineId":"rt_http","date":"2026-10-25","done":true,"doneAt":"2026-10-25T01:00:00.000Z","secs":0,"sessions":[],"deleted":false,"updatedAt":"2026-10-25T01:00:00.000Z","rev":30}],"timer":{"routineId":null,"date":null,"startedAt":null,"updatedAt":"2026-10-25T01:00:00.000Z","rev":31},"cursor":31,"more":false}
        """
        let ch = try JSONDecoder().decode(ChangesResponse.self, from: Data(raw.utf8))
        XCTAssertEqual(ch.routines.first?.color, .aqua)
        XCTAssertEqual(ch.cursor, 31)
        var db = RoutineDB()
        RoutineSync.applyPull(ch, to: &db)
        XCTAssertEqual(db.routine("rt_http")?.slot, .morning)
        XCTAssertEqual(db.log("rt_http", "2026-10-25")?.done, true)
        XCTAssertNil(db.timer)
        XCTAssertEqual(db.sync.cursor, 31)
    }
}
