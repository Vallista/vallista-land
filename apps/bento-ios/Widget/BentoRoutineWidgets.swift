import AppIntents
import RoutineKit
import SwiftUI
import WidgetKit

@main
struct BentoRoutineWidgets: WidgetBundle {
    var body: some Widget {
        TodayRoutineWidget()
        TimerLiveActivity()
    }
}

// MARK: - 오늘 위젯

struct TodayEntry: TimelineEntry {
    struct Item: Identifiable, Equatable {
        let id: String
        let title: String
        let color: RoutineColor
        let done: Bool
    }

    let date: Date
    let today: String
    let items: [Item]
    let streak: Int
    let timerTitle: String?
    let timerStart: Date?

    var done: Int { items.filter(\.done).count }
    var total: Int { items.count }
    var progress: Double { total == 0 ? 0 : Double(done) / Double(total) }
    /// 남은 것 먼저, 그다음 끝낸 것 (각각 원래 순서)
    var ordered: [Item] { items.filter { !$0.done } + items.filter(\.done) }

    static func load(_ now: Date = Date()) -> TodayEntry {
        let db = AppConfig.store.load()
        let today = AppConfig.today(now)
        let slotOrder = Dictionary(uniqueKeysWithValues: RoutineSlot.allCases.enumerated().map { ($1, $0) })
        let routines = db.sortedRoutines
            .filter { RoutineStats.isActive($0, on: today) && RoutineStats.isScheduled($0, on: today) }
            .enumerated()
            .sorted { (slotOrder[$0.element.slot] ?? 0, $0.offset) < (slotOrder[$1.element.slot] ?? 0, $1.offset) }
            .map(\.element)
        let items = routines.map { Item(id: $0.id, title: $0.title, color: $0.color, done: db.log($0.id, today)?.done == true) }
        var timerTitle: String?
        var timerStart: Date?
        if let t = db.timer, let r = db.routine(t.routineId), let started = Clock.parse(t.startedAt) {
            timerTitle = r.title
            timerStart = started.addingTimeInterval(-Double(db.log(r.id, t.date)?.secs ?? 0))
        }
        return TodayEntry(
            date: now,
            today: today,
            items: items,
            streak: RoutineStats.perfectStreak(db.routines, db, today: today).current,
            timerTitle: timerTitle,
            timerStart: timerStart
        )
    }

    static let sample = TodayEntry(
        date: Date(),
        today: AppConfig.today(),
        items: [
            Item(id: "a", title: "물 한 잔", color: .aqua, done: true),
            Item(id: "b", title: "스트레칭", color: .orange, done: true),
            Item(id: "c", title: "독서", color: .violet, done: false),
            Item(id: "d", title: "명상", color: .blue, done: false),
        ],
        streak: 4,
        timerTitle: nil,
        timerStart: nil
    )
}

struct TodayProvider: TimelineProvider {
    func placeholder(in context: Context) -> TodayEntry { .sample }

    func getSnapshot(in context: Context, completion: @escaping (TodayEntry) -> Void) {
        let entry = TodayEntry.load()
        completion(context.isPreview && entry.items.isEmpty ? .sample : entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<TodayEntry>) -> Void) {
        let now = Date()
        let cal = Calendar.current
        // 자정에 새 날로 다시 그린다.
        let midnight = cal.startOfDay(for: cal.date(byAdding: .day, value: 1, to: now) ?? now.addingTimeInterval(86_400))
        let entries = [TodayEntry.load(now), TodayEntry.load(midnight.addingTimeInterval(1))]
        completion(Timeline(entries: entries, policy: .after(midnight.addingTimeInterval(3600))))
    }
}

struct TodayRoutineWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "BentoRoutineToday", provider: TodayProvider()) { entry in
            TodayWidgetView(entry: entry)
        }
        .configurationDisplayName("오늘 루틴")
        .description("오늘 할 루틴을 보고 바로 체크해요.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge, .accessoryCircular, .accessoryRectangular, .accessoryInline])
    }
}

struct TodayWidgetView: View {
    @Environment(\.widgetFamily) private var family
    let entry: TodayEntry

    var body: some View {
        content.containerBackground(for: .widget) { Color(.systemBackground) }
    }

    @ViewBuilder
    private var content: some View {
        switch family {
        case .accessoryCircular:
            Gauge(value: entry.progress) {
                Image(systemName: "checkmark")
            } currentValueLabel: {
                Text("\(entry.done)/\(entry.total)").monospacedDigit()
            }
            .gaugeStyle(.accessoryCircularCapacity)
        case .accessoryRectangular:
            VStack(alignment: .leading, spacing: 2) {
                Text("루틴 \(entry.done)/\(entry.total)").font(.headline).monospacedDigit()
                if let next = entry.ordered.first(where: { !$0.done }) {
                    Text("다음 · \(next.title)").lineLimit(1)
                } else if entry.total > 0 {
                    Text("모두 끝냈어요")
                } else {
                    Text("오늘 예정 없음")
                }
                if entry.streak > 0 { Text("\(entry.streak)일 연속").foregroundStyle(.secondary) }
            }
            .font(.caption)
            .frame(maxWidth: .infinity, alignment: .leading)
        case .accessoryInline:
            Text(entry.streak > 0 ? "루틴 \(entry.done)/\(entry.total) · \(entry.streak)일 연속" : "루틴 \(entry.done)/\(entry.total)")
        case .systemSmall:
            SmallView(entry: entry)
        case .systemLarge:
            ListView(entry: entry, limit: 8, header: true)
        default:
            HStack(spacing: 14) {
                SummaryRing(entry: entry).frame(width: 92)
                ListView(entry: entry, limit: 4, header: false)
            }
        }
    }
}

struct SummaryRing: View {
    let entry: TodayEntry

    var body: some View {
        VStack(spacing: 6) {
            ZStack {
                Circle().stroke(Theme.ok.opacity(0.18), lineWidth: 8)
                Circle()
                    .trim(from: 0, to: entry.progress)
                    .stroke(Theme.ok, style: StrokeStyle(lineWidth: 8, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                Text(entry.total > 0 ? "\(entry.done)/\(entry.total)" : "–")
                    .font(.headline.monospacedDigit())
            }
            .padding(4)
            Text(entry.streak > 0 ? "\(entry.streak)일 연속" : entry.total > 0 && entry.done == entry.total ? "모두 끝!" : "오늘")
                .font(.caption2.weight(.medium))
                .foregroundStyle(entry.streak > 0 ? Theme.ok : .secondary)
        }
    }
}

struct SmallView: View {
    let entry: TodayEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .center) {
                ZStack {
                    Circle().stroke(Theme.ok.opacity(0.18), lineWidth: 5)
                    Circle()
                        .trim(from: 0, to: entry.progress)
                        .stroke(Theme.ok, style: StrokeStyle(lineWidth: 5, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                }
                .frame(width: 30, height: 30)
                VStack(alignment: .leading, spacing: 0) {
                    Text("\(entry.done)/\(entry.total)").font(.headline.monospacedDigit())
                    Text(entry.streak > 0 ? "\(entry.streak)일 연속" : "오늘").font(.caption2).foregroundStyle(.secondary)
                }
            }
            if let title = entry.timerTitle, let start = entry.timerStart {
                TimerLine(title: title, start: start)
            }
            ForEach(entry.ordered.prefix(entry.timerTitle == nil ? 3 : 2)) { item in
                ToggleRow(item: item, compact: true)
            }
            if entry.total == 0 {
                Text("오늘 예정된 루틴이 없어요").font(.caption).foregroundStyle(.secondary)
            }
            Spacer(minLength: 0)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct ListView: View {
    let entry: TodayEntry
    let limit: Int
    let header: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 7) {
            if header {
                HStack {
                    Text("오늘 루틴").font(.headline)
                    Spacer()
                    Text("\(entry.done)/\(entry.total)").font(.headline.monospacedDigit()).foregroundStyle(Theme.ok)
                }
                if entry.streak > 0 {
                    Text("모두 끝낸 날 \(entry.streak)일 연속").font(.caption).foregroundStyle(.secondary)
                }
            }
            if let title = entry.timerTitle, let start = entry.timerStart {
                TimerLine(title: title, start: start)
            }
            if entry.total == 0 {
                Text("오늘 예정된 루틴이 없어요").font(.subheadline).foregroundStyle(.secondary)
            }
            ForEach(entry.ordered.prefix(limit)) { item in
                ToggleRow(item: item, compact: false)
            }
            if entry.total > limit {
                Text("외 \(entry.total - limit)개").font(.caption2).foregroundStyle(.secondary)
            }
            Spacer(minLength: 0)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

/// 누르면 앱을 열지 않고 체크·해제
struct ToggleRow: View {
    let item: TodayEntry.Item
    let compact: Bool

    var body: some View {
        Button(intent: ToggleRoutineIntent(routineId: item.id)) {
            HStack(spacing: 8) {
                ZStack {
                    Circle().strokeBorder(item.color.color, lineWidth: 1.8)
                    if item.done {
                        Circle().fill(item.color.color)
                        Image(systemName: "checkmark").font(.system(size: compact ? 8 : 9, weight: .bold)).foregroundStyle(Color(.systemBackground))
                    }
                }
                .frame(width: compact ? 16 : 18, height: compact ? 16 : 18)
                Text(item.title)
                    .font(compact ? .caption : .subheadline)
                    .lineLimit(1)
                    .strikethrough(item.done, color: .secondary)
                    .foregroundStyle(item.done ? .secondary : .primary)
                Spacer(minLength: 0)
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
}

struct TimerLine: View {
    let title: String
    let start: Date

    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: "timer").foregroundStyle(Theme.time)
            Text(title).lineLimit(1)
            Spacer(minLength: 0)
            Text(start, style: .timer).monospacedDigit().foregroundStyle(Theme.time).multilineTextAlignment(.trailing).frame(maxWidth: 60, alignment: .trailing)
        }
        .font(.caption)
    }
}
