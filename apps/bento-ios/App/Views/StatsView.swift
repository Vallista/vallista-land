import Charts
import RoutineKit
import SwiftUI

/// 기록 — 맥 Bento 루틴 화면의 분석 부분과 같은 순서: 요약 → 필터 → 히트맵 → 기간 → 요일 → 분석 → 루틴별.
struct StatsView: View {
    @EnvironmentObject var model: AppModel
    /// nil = 전체
    @State private var filter: String?

    private var routines: [Routine] {
        guard let filter else { return model.db.routines }
        return model.db.routines.filter { $0.id == filter }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                if model.db.routines.isEmpty {
                    ContentUnavailableView("기록할 루틴이 없어요", systemImage: "chart.bar", description: Text("루틴을 만들고 체크하면 연속 기록과 패턴이 여기에 쌓여요."))
                        .padding(.top, 80)
                } else {
                    VStack(spacing: 14) {
                        KPIGrid()
                        FilterChips(selection: $filter)
                        Card(title: "1년") { HeatmapView(routines: routines) }
                        Card(title: nil) { PeriodPanel(routines: routines) }
                        Card(title: "요일 · 시간대별 달성률", note: "최근 8주") { PatternPanel(routines: routines) }
                        InsightsCard(routines: routines)
                        Card(title: "루틴별", note: "30일") {
                            RoutineRowsView(routines: routines.isEmpty ? model.db.routines : routines, filter: $filter)
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.bottom, 24)
                }
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("기록")
            .refreshable { await model.syncNow() }
        }
    }
}

// MARK: - 카드

struct Card<Content: View>: View {
    let title: String?
    var note: String?
    @ViewBuilder var content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            if let title {
                HStack(alignment: .firstTextBaseline) {
                    Text(title).font(.subheadline.weight(.semibold))
                    Spacer()
                    if let note { Text(note).font(.caption).foregroundStyle(.secondary) }
                }
            }
            content
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(.secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}

// MARK: - 요약 4칸 (필터와 무관)

struct KPIGrid: View {
    @EnvironmentObject var model: AppModel

    var body: some View {
        let db = model.db
        let today = model.today
        let all = db.routines
        let todayStat = RoutineStats.day(all, db, today, today: today)
        let perfect = RoutineStats.perfectStreak(all, db, today: today)
        let r30 = RoutineStats.summarize(all, db, from: DayKey.add(today, -29), to: today, today: today)
        let p30 = RoutineStats.summarize(all, db, from: DayKey.add(today, -59), to: DayKey.add(today, -30), today: today)
        let ws = DayKey.weekStart(today, mondayFirst: model.mondayFirst)
        let elapsed = DayKey.between(ws, today)
        let week = RoutineStats.summarize(all, db, from: ws, to: today, today: today)
        let lastWeek = RoutineStats.summarize(all, db, from: DayKey.add(ws, -7), to: DayKey.add(ws, elapsed - 7), today: today)

        LazyVGrid(columns: [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)], spacing: 10) {
            KPITile(
                label: "오늘",
                value: todayStat.scheduled > 0 ? "\(todayStat.done)/\(todayStat.scheduled)" : "–",
                sub: todayStat.scheduled == 0 ? "예정 없음" : todayStat.done == todayStat.scheduled ? "모두 끝냄" : "\(todayStat.scheduled - todayStat.done)개 남음",
                tone: todayStat.scheduled > 0 && todayStat.done == todayStat.scheduled ? .good : .plain
            )
            KPITile(label: "모두 끝낸 날", value: "\(perfect.current)일 연속", sub: "최고 \(perfect.best)일", tone: perfect.current > 0 ? .good : .plain)
            KPITile(label: "30일 달성률", value: RoutineStats.pct(r30.rate), sub: diffText(r30.rate, p30.rate, "앞 30일"), tone: .plain)
            KPITile(
                label: "이번 주 시간",
                value: RoutineStats.formatSecs(week.secs),
                sub: lastWeek.secs > 0 || week.secs > 0 ? "지난주 같은 기간 \(RoutineStats.formatSecs(lastWeek.secs))" : "기록 없음",
                tone: .time
            )
        }
    }

    private func diffText(_ now: Double?, _ before: Double?, _ label: String) -> String {
        guard let now, let before else { return "\(label) 기록 없음" }
        let d = Int(((now - before) * 100).rounded())
        if d == 0 { return "\(label)과 같음" }
        return "\(label) 대비 \(d > 0 ? "+" : "")\(d)%p"
    }
}

struct KPITile: View {
    enum Tone { case plain, good, time }
    let label: String
    let value: String
    let sub: String
    let tone: Tone

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label).font(.caption).foregroundStyle(.secondary)
            Text(value)
                .font(.title3.weight(.semibold).monospacedDigit())
                .foregroundStyle(tone == .good ? Theme.ok : tone == .time ? Theme.time : .primary)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
            Text(sub).font(.caption2).foregroundStyle(.secondary).lineLimit(1).minimumScaleFactor(0.8)
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(.secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}

// MARK: - 필터

struct FilterChips: View {
    @EnvironmentObject var model: AppModel
    @Binding var selection: String?

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                chip(nil, title: "전체", color: nil, dim: false)
                ForEach(model.db.sortedRoutines) { r in
                    chip(r.id, title: r.title, color: r.color.color, dim: r.isArchived)
                }
            }
            .padding(.vertical, 2)
        }
    }

    private func chip(_ id: String?, title: String, color: Color?, dim: Bool) -> some View {
        let on = selection == id
        return Button {
            selection = id
        } label: {
            HStack(spacing: 6) {
                if let color { Circle().fill(color).frame(width: 8, height: 8) }
                Text(title).lineLimit(1)
            }
            .font(.subheadline.weight(on ? .semibold : .regular))
            .padding(.horizontal, 12)
            .padding(.vertical, 7)
            .background(on ? Color.primary.opacity(0.12) : Color(.secondarySystemGroupedBackground), in: Capsule())
            .overlay(Capsule().strokeBorder(on ? Color.primary.opacity(0.25) : .clear))
            .opacity(dim && !on ? 0.6 : 1)
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(on ? .isSelected : [])
    }
}

// MARK: - 히트맵

struct HeatmapView: View {
    @EnvironmentObject var model: AppModel
    let routines: [Routine]

    private let cell: CGFloat = 13
    private let gap: CGFloat = 3
    private let weeks = 53

    var body: some View {
        let today = model.today
        let first = DayKey.add(DayKey.weekStart(today, mondayFirst: model.mondayFirst), -(weeks - 1) * 7)
        let start = routines.map(\.startDate).min() ?? today
        let columns = (0..<weeks).map { w in (0..<7).map { DayKey.add(first, w * 7 + $0) } }
        let dowRows = model.mondayFirst ? ["월", "", "수", "", "금", "", ""] : ["", "월", "", "수", "", "금", ""]

        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top, spacing: 6) {
                VStack(spacing: gap) {
                    Text(" ").font(.system(size: 9))
                    ForEach(0..<7, id: \.self) { i in
                        Text(dowRows[i]).font(.system(size: 9)).foregroundStyle(.secondary).frame(height: cell)
                    }
                }
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(alignment: .top, spacing: gap) {
                        ForEach(columns, id: \.first) { days in
                            VStack(spacing: gap) {
                                Text(monthLabel(days))
                                    .font(.system(size: 9))
                                    .foregroundStyle(.secondary)
                                    .fixedSize()
                                    .frame(width: cell, alignment: .leading)
                                ForEach(days, id: \.self) { d in
                                    HeatCell(day: d, routines: routines, start: start, size: cell)
                                }
                            }
                        }
                    }
                }
                .defaultScrollAnchor(.trailing)
            }
            HStack(spacing: 4) {
                Text("적음").font(.caption2).foregroundStyle(.secondary)
                ForEach(0..<5, id: \.self) { l in
                    RoundedRectangle(cornerRadius: 2.5).fill(Theme.heat(l)).frame(width: 10, height: 10)
                }
                Text("많음").font(.caption2).foregroundStyle(.secondary)
                Spacer()
                Text("칸을 누르면 그 날 기록을 고쳐요").font(.caption2).foregroundStyle(.secondary)
            }
        }
    }

    /// 그 주에 1일이 들어 있으면 달 이름
    private func monthLabel(_ days: [String]) -> String {
        guard let d = days.first(where: { $0.hasSuffix("-01") }) else { return " " }
        return "\(Int(d.dropFirst(5).prefix(2)) ?? 0)월"
    }
}

struct HeatCell: View {
    @EnvironmentObject var model: AppModel
    let day: String
    let routines: [Routine]
    let start: String
    let size: CGFloat

    var body: some View {
        let future = day > model.today
        let before = day < start
        let s = RoutineStats.day(routines, model.db, day, today: model.today)
        let level = (future || before) ? nil : Theme.level(rate: s.rate, extra: s.extra)
        RoundedRectangle(cornerRadius: 2.5)
            .fill(future ? Color.clear : Theme.heat(level))
            .frame(width: size, height: size)
            .overlay {
                if day == model.today {
                    RoundedRectangle(cornerRadius: 2.5).strokeBorder(Color.primary.opacity(0.6), lineWidth: 1)
                }
            }
            .contentShape(Rectangle())
            .onTapGesture {
                guard !future, !before else { return }
                model.selectedDate = day
                model.tab = .today
            }
            .accessibilityElement()
            .accessibilityLabel(future ? "" : "\(DayKey.label(day)) \(s.scheduled > 0 ? "\(s.done)/\(s.scheduled)" : "예정 없음")")
            .accessibilityHidden(future)
    }
}

// MARK: - 주간 · 월간

struct DayPoint: Identifiable {
    let key: String
    let date: Date
    let stat: RoutineStats.DayStat
    var id: String { key }
    var pct: Double? { stat.rate.map { $0 * 100 } }
    var mins: Double { Double(stat.secs) / 60 }
}

struct PeriodPanel: View {
    @EnvironmentObject var model: AppModel
    let routines: [Routine]

    enum Span: Hashable { case week, month }
    enum Metric: Hashable { case rate, time }

    @State private var span: Span = .week
    @State private var offset = 0
    @State private var metric: Metric = .rate
    @State private var picked: Date?

    var body: some View {
        let today = model.today
        let (from, to) = range(today)
        let elapsedTo = min(to, today)
        let len = DayKey.between(from, elapsedTo)
        let cur = RoutineStats.summarize(routines, model.db, from: from, to: to, today: today)
        let prevFrom = span == .week ? DayKey.add(from, -7) : DayKey.monthStart(DayKey.add(from, -1))
        let prevTo = min(DayKey.add(prevFrom, len), DayKey.add(from, -1))
        let prev = RoutineStats.summarize(routines, model.db, from: prevFrom, to: prevTo, today: today)
        let points = cur.days.compactMap { s in DayKey.date(s.date).map { DayPoint(key: s.date, date: $0, stat: s) } }
        let earliest = routines.map(\.startDate).min() ?? today

        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Picker("기간", selection: $span) {
                    Text("주간").tag(Span.week)
                    Text("월간").tag(Span.month)
                }
                .pickerStyle(.segmented)
                .frame(width: 140)
                .onChange(of: span) { _, _ in
                    offset = 0
                    picked = nil
                }
                Spacer()
                Button {
                    offset -= 1
                    picked = nil
                } label: {
                    Image(systemName: "chevron.left").frame(width: 30, height: 30)
                }
                .disabled(DayKey.add(from, -1) < earliest)
                Text(title(from, to)).font(.footnote.weight(.semibold)).monospacedDigit()
                Button {
                    offset += 1
                    picked = nil
                } label: {
                    Image(systemName: "chevron.right").frame(width: 30, height: 30)
                }
                .disabled(offset >= 0)
            }
            .buttonStyle(.borderless)

            HStack(alignment: .top, spacing: 0) {
                PeriodStat(label: "달성률", value: RoutineStats.pct(cur.rate), sub: compare(cur.rate, prev.rate))
                PeriodStat(label: "완료", value: "\(cur.done)/\(cur.scheduled)", sub: "모두 끝낸 날 \(cur.perfectDays)일")
                PeriodStat(label: "시간", value: RoutineStats.formatSecs(cur.secs), sub: timeCompare(cur.secs, prev.secs))
            }

            HStack {
                Picker("보기", selection: $metric) {
                    Text("달성률").tag(Metric.rate)
                    Text("시간").tag(Metric.time)
                }
                .pickerStyle(.segmented)
                .frame(width: 140)
                Spacer()
                Text(pickedText(points)).font(.caption).foregroundStyle(.secondary).monospacedDigit()
            }

            PeriodChart(points: points, metric: metric, span: span, picked: $picked)
                .frame(height: 150)
        }
    }

    private func range(_ today: String) -> (String, String) {
        switch span {
        case .week:
            let from = DayKey.add(DayKey.weekStart(today, mondayFirst: model.mondayFirst), offset * 7)
            return (from, DayKey.add(from, 6))
        case .month:
            var m = DayKey.monthStart(today)
            if offset < 0 {
                for _ in 0..<(-offset) { m = DayKey.monthStart(DayKey.add(m, -1)) }
            }
            return (m, DayKey.monthEnd(m))
        }
    }

    private func title(_ from: String, _ to: String) -> String {
        let fm = Int(from.dropFirst(5).prefix(2)) ?? 0
        let fd = Int(from.suffix(2)) ?? 0
        let tm = Int(to.dropFirst(5).prefix(2)) ?? 0
        let td = Int(to.suffix(2)) ?? 0
        if span == .month { return "\(from.prefix(4))년 \(fm)월" }
        return fm == tm ? "\(fm)/\(fd)–\(td)" : "\(fm)/\(fd)–\(tm)/\(td)"
    }

    private func compare(_ now: Double?, _ before: Double?) -> String {
        guard let now, let before else { return "지난 기간 기록 없음" }
        let d = Int(((now - before) * 100).rounded())
        return d == 0 ? "지난 기간과 같음" : "지난 기간 대비 \(d > 0 ? "+" : "")\(d)%p"
    }

    private func timeCompare(_ now: Int, _ before: Int) -> String {
        guard now > 0 || before > 0 else { return "기록 없음" }
        let d = (now - before) / 60
        if abs(d) < 1 { return "지난 기간과 비슷" }
        return "지난 기간 대비 \(d > 0 ? "+" : "−")\(RoutineStats.formatSecs(abs(d) * 60))"
    }

    private func pickedText(_ points: [DayPoint]) -> String {
        guard let picked, let p = points.first(where: { Calendar.current.isDate($0.date, inSameDayAs: picked) }), !p.stat.future else {
            return "막대를 누르면 그 날 숫자"
        }
        let rate = p.stat.scheduled > 0 ? "\(p.stat.done)/\(p.stat.scheduled)" : "예정 없음"
        return "\(DayKey.label(p.key)) · \(rate) · \(RoutineStats.formatSecs(p.stat.secs))"
    }
}

struct PeriodStat: View {
    let label: String
    let value: String
    let sub: String

    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(label).font(.caption).foregroundStyle(.secondary)
            Text(value).font(.headline.monospacedDigit()).lineLimit(1).minimumScaleFactor(0.7)
            Text(sub).font(.caption2).foregroundStyle(.secondary).lineLimit(2).fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct PeriodChart: View {
    let points: [DayPoint]
    let metric: PeriodPanel.Metric
    let span: PeriodPanel.Span
    @Binding var picked: Date?

    var body: some View {
        Chart {
            ForEach(points) { p in
                if !p.stat.future {
                    if metric == .rate {
                        if let pct = p.pct {
                            BarMark(x: .value("날", p.date, unit: .day), y: .value("달성률", pct), width: .ratio(0.7))
                                .foregroundStyle(Theme.ok.opacity(isPicked(p) || picked == nil ? 1 : 0.45))
                                .cornerRadius(3)
                        }
                    } else {
                        BarMark(x: .value("날", p.date, unit: .day), y: .value("분", p.mins), width: .ratio(0.7))
                            .foregroundStyle(Theme.time.opacity(isPicked(p) || picked == nil ? 1 : 0.45))
                            .cornerRadius(3)
                    }
                }
            }
        }
        .chartXScale(domain: domain)
        .chartXSelection(value: $picked)
        .chartYScale(domain: metric == .rate ? 0...100 : 0...max(10, (points.map(\.mins).max() ?? 0) * 1.15))
        .chartYAxis {
            AxisMarks(position: .leading, values: .automatic(desiredCount: 3)) { v in
                AxisGridLine(stroke: StrokeStyle(lineWidth: 0.5))
                AxisValueLabel {
                    if let n = v.as(Double.self) {
                        Text(metric == .rate ? "\(Int(n))%" : "\(Int(n))분").font(.caption2)
                    }
                }
            }
        }
        .chartXAxis {
            AxisMarks(values: .stride(by: .day, count: span == .week ? 1 : 7)) { _ in
                AxisValueLabel(format: span == .week ? .dateTime.weekday(.narrow) : .dateTime.day(), centered: true)
            }
        }
    }

    private var domain: ClosedRange<Date> {
        let first = points.first?.date ?? Date()
        let last = points.last?.date ?? Date()
        return first.addingTimeInterval(-12 * 3600)...last.addingTimeInterval(12 * 3600)
    }

    private func isPicked(_ p: DayPoint) -> Bool {
        guard let picked else { return false }
        return Calendar.current.isDate(p.date, inSameDayAs: picked)
    }
}

// MARK: - 요일 · 시간대

struct WeekdayPoint: Identifiable {
    let dow: Int
    let label: String
    let pct: Double?
    var id: Int { dow }
}

struct SlotRate: Identifiable {
    let slot: RoutineSlot
    let rate: Double
    var id: RoutineSlot { slot }
}

struct PatternPanel: View {
    @EnvironmentObject var model: AppModel
    let routines: [Routine]

    var body: some View {
        let today = model.today
        let from = DayKey.add(today, -55)
        let rates = RoutineStats.weekdayRates(routines, model.db, from: from, to: today)
        let order = model.mondayFirst ? [1, 2, 3, 4, 5, 6, 0] : [0, 1, 2, 3, 4, 5, 6]
        let points = order.map { WeekdayPoint(dow: $0, label: RoutineStats.weekdayLabel($0), pct: rates[$0].rate.map { $0 * 100 }) }
        let slots = RoutineStats.slotRates(routines, model.db, from: from, to: today)
        let shown = points.compactMap(\.pct)
        let best = shown.max()
        let worst = shown.min()

        VStack(alignment: .leading, spacing: 14) {
            Chart(points) { p in
                if let pct = p.pct {
                    BarMark(x: .value("요일", p.label), y: .value("달성률", pct), width: .ratio(0.6))
                        .foregroundStyle(Theme.ok.opacity(pct == best && best != worst ? 1 : 0.6))
                        .cornerRadius(3)
                        .annotation(position: .top, spacing: 2) {
                            Text("\(Int(pct.rounded()))").font(.caption2.monospacedDigit()).foregroundStyle(.secondary)
                        }
                }
            }
            .chartXScale(domain: points.map(\.label))
            .chartYScale(domain: 0...110)
            .chartYAxis(.hidden)
            .frame(height: 120)

            let slotItems = RoutineSlot.allCases.compactMap { s in slots[s]?.rate.map { SlotRate(slot: s, rate: $0) } }
            if !slotItems.isEmpty {
                VStack(spacing: 8) {
                    ForEach(slotItems) { item in
                        HStack(spacing: 10) {
                            Text(item.slot.label).font(.caption).frame(width: 44, alignment: .leading)
                            GeometryReader { g in
                                ZStack(alignment: .leading) {
                                    Capsule().fill(Theme.ok.opacity(0.15))
                                    Capsule().fill(Theme.ok).frame(width: g.size.width * item.rate)
                                }
                            }
                            .frame(height: 6)
                            Text(RoutineStats.pct(item.rate)).font(.caption.monospacedDigit()).frame(width: 40, alignment: .trailing)
                        }
                    }
                }
            }
        }
    }
}

// MARK: - 분석 문장

struct InsightsCard: View {
    @EnvironmentObject var model: AppModel
    let routines: [Routine]

    var body: some View {
        let items = RoutineStats.insights(routines, model.db, today: model.today, mondayFirst: model.mondayFirst)
        if !items.isEmpty {
            Card(title: "분석") {
                VStack(alignment: .leading, spacing: 10) {
                    ForEach(items) { i in
                        HStack(alignment: .firstTextBaseline, spacing: 8) {
                            Image(systemName: icon(i.tone))
                                .font(.caption)
                                .foregroundStyle(color(i.tone))
                            Text(i.text).font(.subheadline).fixedSize(horizontal: false, vertical: true)
                        }
                    }
                }
            }
        }
    }

    private func icon(_ t: RoutineStats.Insight.Tone) -> String {
        switch t {
        case .good: return "arrow.up.right"
        case .warn: return "exclamationmark.circle"
        case .info: return "lightbulb"
        }
    }

    private func color(_ t: RoutineStats.Insight.Tone) -> Color {
        switch t {
        case .good: return Theme.ok
        case .warn: return Theme.warn
        case .info: return .secondary
        }
    }
}

// MARK: - 루틴별

struct RoutineRowsView: View {
    @EnvironmentObject var model: AppModel
    let routines: [Routine]
    @Binding var filter: String?

    var body: some View {
        let order = Dictionary(uniqueKeysWithValues: model.db.sortedRoutines.enumerated().map { ($1.id, $0) })
        let rows = RoutineStats.rows(routines, model.db, today: model.today)
            .sorted { (order[$0.id] ?? 0) < (order[$1.id] ?? 0) }
        VStack(spacing: 0) {
            ForEach(Array(rows.enumerated()), id: \.element.id) { i, row in
                if i > 0 { Divider().padding(.vertical, 8) }
                Button {
                    filter = filter == row.id ? nil : row.id
                } label: {
                    StatRow(row: row)
                }
                .buttonStyle(.plain)
            }
        }
    }
}

struct StatRow: View {
    let row: RoutineStats.Row

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 8) {
                Circle().fill(row.routine.color.color).frame(width: 9, height: 9)
                Text(row.routine.title).font(.subheadline.weight(.medium)).lineLimit(1)
                if row.routine.isArchived {
                    Text("보관").font(.caption2).foregroundStyle(.secondary)
                        .padding(.horizontal, 5).padding(.vertical, 1)
                        .background(Color(.tertiarySystemFill), in: Capsule())
                }
                Spacer()
                Text(RoutineStats.pct(row.rate30.rate)).font(.subheadline.monospacedDigit().weight(.semibold))
            }
            HStack(spacing: 10) {
                HStack(spacing: 2.5) {
                    ForEach(Array(row.recent.enumerated()), id: \.offset) { _, c in
                        RecentCell(state: c, color: row.routine.color.color)
                    }
                }
                Spacer(minLength: 0)
                VStack(alignment: .trailing, spacing: 1) {
                    Text(row.streak.current > 0 ? "\(row.streak.current)일 연속" : "연속 없음")
                        .foregroundStyle(row.streak.current > 0 ? Theme.ok : .secondary)
                    Text("최고 \(row.streak.best)일 · 7일 \(RoutineStats.formatSecs(row.secs7))").foregroundStyle(.secondary)
                }
                .font(.caption2.monospacedDigit())
            }
        }
        .contentShape(Rectangle())
    }
}

struct RecentCell: View {
    let state: RoutineStats.CellState
    let color: Color

    var body: some View {
        Group {
            switch state {
            case .done: RoundedRectangle(cornerRadius: 2).fill(color)
            case .extra: RoundedRectangle(cornerRadius: 2).fill(color.opacity(0.4))
            case .missed: RoundedRectangle(cornerRadius: 2).fill(Color(.systemFill))
            case .pending: RoundedRectangle(cornerRadius: 2).strokeBorder(color.opacity(0.7), lineWidth: 1)
            case .off: RoundedRectangle(cornerRadius: 2).fill(Color(.quaternarySystemFill))
            }
        }
        .frame(width: 10, height: 10)
    }
}
