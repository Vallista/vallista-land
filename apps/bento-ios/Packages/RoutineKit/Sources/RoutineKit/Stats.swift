import Foundation

// 통계 — 맥 Bento 의 `src/lib/routineStats.ts` 와 같은 규칙.
//   스트릭은 예정일만 센다. 오늘 아직 안 한 것은 끊김이 아니라 '진행 중'.
//   예정 없는 날 한 것은 보너스(스트릭과 무관).

public enum RoutineStats {
    // MARK: 예정일

    /// 시작일 이후, 보관 전, 쉬는 구간 밖
    public static func isActive(_ r: Routine, on day: String) -> Bool {
        if day < r.startDate { return false }
        if let a = r.archivedAt, day >= a { return false }
        for p in r.pauses where day >= p.from && day <= p.to { return false }
        return true
    }

    public static func isScheduled(_ r: Routine, on day: String) -> Bool {
        guard isActive(r, on: day) else { return false }
        if r.schedule.freq == .daily { return true }
        return r.schedule.weekdays.contains(DayKey.weekday(day))
    }

    static func isDone(_ db: RoutineDB, _ routineId: String, _ day: String) -> Bool {
        db.log(routineId, day)?.done == true
    }

    // MARK: 하루 · 기간

    public struct DayStat: Equatable, Sendable {
        public var date: String
        public var scheduled: Int
        /// 예정 중 완료
        public var done: Int
        /// 예정 아닌 날 완료
        public var extra: Int
        public var secs: Int
        public var future: Bool
        public var rate: Double? { scheduled > 0 ? Double(done) / Double(scheduled) : nil }
    }

    public static func day(_ routines: [Routine], _ db: RoutineDB, _ day: String, today: String) -> DayStat {
        var s = DayStat(date: day, scheduled: 0, done: 0, extra: 0, secs: 0, future: day > today)
        for r in routines {
            let log = db.log(r.id, day)
            s.secs += log?.secs ?? 0
            if isScheduled(r, on: day) {
                s.scheduled += 1
                if log?.done == true { s.done += 1 }
            } else if log?.done == true {
                s.extra += 1
            }
        }
        return s
    }

    public struct RangeSummary: Equatable, Sendable {
        public var days: [DayStat]
        public var scheduled = 0
        public var done = 0
        public var secs = 0
        /// 예정한 루틴을 모두 끝낸 날
        public var perfectDays = 0
        /// 하나라도 완료한 날
        public var activeDays = 0
        public var rate: Double? { scheduled > 0 ? Double(done) / Double(scheduled) : nil }
    }

    /// 미래 날짜는 days 에 넣되 합계에서 뺀다.
    public static func summarize(_ routines: [Routine], _ db: RoutineDB, from: String, to: String, today: String) -> RangeSummary {
        let days = DayKey.range(from, to).map { day(routines, db, $0, today: today) }
        var out = RangeSummary(days: days)
        for s in days where !s.future {
            out.scheduled += s.scheduled
            out.done += s.done
            out.secs += s.secs
            if s.scheduled > 0 && s.done == s.scheduled { out.perfectDays += 1 }
            if s.done + s.extra > 0 { out.activeDays += 1 }
        }
        return out
    }

    // MARK: 스트릭

    public struct Streak: Equatable, Sendable {
        public var current = 0
        public var best = 0
        /// 오늘이 예정일인데 아직 안 함
        public var pendingToday = false
    }

    public static func streak(_ r: Routine, _ db: RoutineDB, today: String) -> Streak {
        var s = Streak()
        guard r.startDate <= today else { return s }
        var cur = 0
        for day in DayKey.range(r.startDate, today) where isScheduled(r, on: day) {
            if isDone(db, r.id, day) {
                cur += 1
                s.best = max(s.best, cur)
            } else if day == today {
                s.pendingToday = true
            } else {
                cur = 0
            }
        }
        s.current = cur
        return s
    }

    /// 예정한 루틴을 전부 끝낸 날의 연속. 예정 없는 날은 건너뛴다.
    public static func perfectStreak(_ routines: [Routine], _ db: RoutineDB, today: String) -> (current: Int, best: Int) {
        guard let first = routines.map(\.startDate).min(), first <= today else { return (0, 0) }
        var cur = 0
        var best = 0
        for d in DayKey.range(first, today) {
            let s = day(routines, db, d, today: today)
            if s.scheduled == 0 { continue }
            if s.done == s.scheduled {
                cur += 1
                best = max(best, cur)
            } else if d != today {
                cur = 0
            }
        }
        return (cur, best)
    }

    // MARK: 패턴

    public struct Rate: Equatable, Sendable {
        public var scheduled = 0
        public var done = 0
        public var rate: Double? { scheduled > 0 ? Double(done) / Double(scheduled) : nil }
    }

    /// 요일별(0=일 … 6=토)
    public static func weekdayRates(_ routines: [Routine], _ db: RoutineDB, from: String, to: String) -> [Rate] {
        var out = Array(repeating: Rate(), count: 7)
        for d in DayKey.range(from, to) {
            let dow = DayKey.weekday(d)
            for r in routines where isScheduled(r, on: d) {
                out[dow].scheduled += 1
                if isDone(db, r.id, d) { out[dow].done += 1 }
            }
        }
        return out
    }

    public static func slotRates(_ routines: [Routine], _ db: RoutineDB, from: String, to: String) -> [RoutineSlot: Rate] {
        var out: [RoutineSlot: Rate] = [:]
        for slot in RoutineSlot.allCases { out[slot] = Rate() }
        for d in DayKey.range(from, to) {
            for r in routines where isScheduled(r, on: d) {
                out[r.slot, default: Rate()].scheduled += 1
                if isDone(db, r.id, d) { out[r.slot, default: Rate()].done += 1 }
            }
        }
        return out
    }

    public enum CellState: String, Sendable {
        case done, missed, pending, extra, off
    }

    public static func cell(_ r: Routine, _ db: RoutineDB, _ day: String, today: String) -> CellState {
        let done = isDone(db, r.id, day)
        guard isScheduled(r, on: day) else { return done ? .extra : .off }
        if done { return .done }
        return day >= today ? .pending : .missed
    }

    // MARK: 루틴별

    public struct Row: Identifiable, Equatable, Sendable {
        public var routine: Routine
        public var streak: Streak
        public var rate7: Rate
        public var rate30: Rate
        public var secs7: Int
        public var secs30: Int
        /// 최근 14일, 오래된 날부터
        public var recent: [CellState]
        public var id: String { routine.id }
    }

    static func rate(_ r: Routine, _ db: RoutineDB, from: String, to: String) -> Rate {
        var out = Rate()
        for d in DayKey.range(from, to) where isScheduled(r, on: d) {
            out.scheduled += 1
            if isDone(db, r.id, d) { out.done += 1 }
        }
        return out
    }

    static func secs(_ r: Routine, _ db: RoutineDB, from: String, to: String) -> Int {
        DayKey.range(from, to).reduce(0) { $0 + (db.log(r.id, $1)?.secs ?? 0) }
    }

    public static func rows(_ routines: [Routine], _ db: RoutineDB, today: String) -> [Row] {
        routines.map { r in
            Row(
                routine: r,
                streak: streak(r, db, today: today),
                rate7: rate(r, db, from: DayKey.add(today, -6), to: today),
                rate30: rate(r, db, from: DayKey.add(today, -29), to: today),
                secs7: secs(r, db, from: DayKey.add(today, -6), to: today),
                secs30: secs(r, db, from: DayKey.add(today, -29), to: today),
                recent: DayKey.range(DayKey.add(today, -13), today).map { cell(r, db, $0, today: today) }
            )
        }
    }

    // MARK: 분석 문장

    public struct Insight: Identifiable, Equatable, Sendable {
        public enum Tone: String, Sendable { case good, warn, info }
        public var id: String
        public var tone: Tone
        public var text: String
    }

    /// 기록에서 눈여겨볼 점. 근거가 얇으면(예정일이 적으면) 말하지 않는다. 최대 5개.
    /// `routines` 는 보관하지 않은 루틴만.
    public static func insights(_ routines: [Routine], _ db: RoutineDB, today: String, mondayFirst: Bool) -> [Insight] {
        var out: [Insight] = []
        guard !routines.isEmpty else { return out }

        let ws = DayKey.weekStart(today, mondayFirst: mondayFirst)
        let elapsed = DayKey.between(ws, today)
        let thisWeek = summarize(routines, db, from: ws, to: today, today: today)
        let lastFrom = DayKey.add(ws, -7)
        let lastWeek = summarize(routines, db, from: lastFrom, to: DayKey.add(lastFrom, elapsed), today: today)
        if let a = thisWeek.rate, let b = lastWeek.rate, thisWeek.scheduled >= 3, lastWeek.scheduled >= 3 {
            let delta = Int(((a - b) * 100).rounded())
            if abs(delta) >= 5 {
                out.append(Insight(
                    id: "week-delta",
                    tone: delta > 0 ? .good : .warn,
                    text: "이번 주 달성률 \(pct(a)) — 지난주 같은 기간보다 \(abs(delta))%p \(delta > 0 ? "높아요" : "낮아요")."
                ))
            }
        }

        let all = rows(routines, db, today: today)
        let record = all
            .filter { $0.streak.current >= 3 && $0.streak.current == $0.streak.best }
            .max { $0.streak.current < $1.streak.current }
        if let record {
            out.append(Insight(
                id: "record-\(record.id)",
                tone: .good,
                text: "‘\(record.routine.title)’ \(record.streak.current)일 연속 — 최고 기록을 갱신하는 중이에요."
            ))
        }

        let stake = all
            .filter { $0.streak.pendingToday && $0.streak.current >= 3 && $0.id != record?.id }
            .max { $0.streak.current < $1.streak.current }
        if let stake {
            out.append(Insight(
                id: "stake-\(stake.id)",
                tone: .info,
                text: "‘\(stake.routine.title)’ 오늘도 하면 \(stake.streak.current + 1)일 연속이에요."
            ))
        }

        let yesterday = DayKey.add(today, -1)
        let wd = weekdayRates(routines, db, from: DayKey.add(today, -56), to: yesterday)
        let judged = wd.enumerated().filter { $0.element.rate != nil && $0.element.scheduled >= 4 }
        if judged.count >= 3 {
            let total = judged.reduce(0) { $0 + $1.element.scheduled }
            let avg = Double(judged.reduce(0) { $0 + $1.element.done }) / Double(total)
            if let worst = judged.min(by: { ($0.element.rate ?? 0) < ($1.element.rate ?? 0) }),
               let best = judged.max(by: { ($0.element.rate ?? 0) < ($1.element.rate ?? 0) }),
               avg - (worst.element.rate ?? 0) >= 0.15 {
                out.append(Insight(
                    id: "weekday",
                    tone: .warn,
                    text: "최근 8주 동안 \(weekdayLabel(worst.offset))요일 달성률이 가장 낮아요 (\(pct(worst.element.rate)), 평균 \(pct(avg))). 가장 잘 지키는 날은 \(weekdayLabel(best.offset))요일(\(pct(best.element.rate)))이에요."
                ))
            }
        }

        let struggling = all
            .filter { $0.rate30.scheduled >= 8 && ($0.rate30.rate ?? 1) < 0.5 }
            .min { ($0.rate30.rate ?? 0) < ($1.rate30.rate ?? 0) }
        if let struggling {
            out.append(Insight(
                id: "struggle-\(struggling.id)",
                tone: .warn,
                text: "‘\(struggling.routine.title)’ 최근 30일 달성률 \(pct(struggling.rate30.rate)) — 요일을 줄이거나 목표를 낮춰 보는 것도 방법이에요."
            ))
        }

        let weekSecs = routines
            .map { ($0, secs($0, db, from: ws, to: today)) }
            .max { $0.1 < $1.1 }
        if let top = weekSecs, top.1 >= 600 {
            out.append(Insight(
                id: "time-top",
                tone: .info,
                text: "이번 주는 ‘\(top.0.title)’에 가장 많은 시간을 썼어요 (\(formatSecs(top.1)), 하루 평균 \(formatSecs(top.1 / (elapsed + 1))))."
            ))
        }

        let slots = slotRates(routines, db, from: DayKey.add(today, -29), to: yesterday)
        let comparable = RoutineSlot.allCases
            .filter { $0 != .anytime && (slots[$0]?.scheduled ?? 0) >= 10 && slots[$0]?.rate != nil }
            .sorted { (slots[$0]?.rate ?? 0) > (slots[$1]?.rate ?? 0) }
        if comparable.count >= 2, let hi = comparable.first, let lo = comparable.last,
           (slots[hi]?.rate ?? 0) - (slots[lo]?.rate ?? 0) >= 0.15 {
            out.append(Insight(
                id: "slot",
                tone: .info,
                text: "\(hi.label) 루틴(\(pct(slots[hi]?.rate)))이 \(lo.label) 루틴(\(pct(slots[lo]?.rate)))보다 잘 지켜지고 있어요."
            ))
        }

        return Array(out.prefix(5))
    }

    // MARK: 글자

    public static func pct(_ rate: Double?) -> String {
        guard let rate, rate.isFinite else { return "–" }
        return "\(Int((rate * 100).rounded()))%"
    }

    public static func formatSecs(_ secs: Int) -> String {
        guard secs >= 60 else { return "0분" }
        let min = secs / 60
        if min < 60 { return "\(min)분" }
        let h = min / 60
        let m = min % 60
        return m == 0 ? "\(h)시간" : "\(h)시간 \(m)분"
    }

    /// mm:ss / h:mm:ss
    public static func formatClock(_ secs: Int) -> String {
        let s = max(0, secs)
        let h = s / 3600
        let m = (s % 3600) / 60
        let ss = s % 60
        return h > 0 ? String(format: "%d:%02d:%02d", h, m, ss) : String(format: "%02d:%02d", m, ss)
    }

    public static func weekdayLabel(_ dow: Int) -> String {
        ["일", "월", "화", "수", "목", "금", "토"][((dow % 7) + 7) % 7]
    }

    public static func describe(_ schedule: RoutineSchedule) -> String {
        guard schedule.freq == .weekly else { return "매일" }
        let days = schedule.weekdays.sorted { ($0 + 6) % 7 < ($1 + 6) % 7 }
        if days.count == 5 && [1, 2, 3, 4, 5].allSatisfy(days.contains) { return "평일" }
        if days.count == 2 && days.contains(0) && days.contains(6) { return "주말" }
        return days.map(weekdayLabel).joined(separator: "·")
    }
}
