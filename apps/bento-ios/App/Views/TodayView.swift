import RoutineKit
import SwiftUI

struct TodayView: View {
    @EnvironmentObject var model: AppModel
    @State private var editing: Routine?
    @State private var adding: RoutineTemplate?
    @State private var showOff = false
    @State private var minutesFor: Routine?
    @State private var minutesText = ""

    private var date: String { model.selectedDate }
    private var isToday: Bool { date == model.today }
    private var active: [Routine] { model.db.sortedRoutines.filter { RoutineStats.isActive($0, on: date) } }
    private var scheduled: [Routine] { active.filter { RoutineStats.isScheduled($0, on: date) } }
    private var off: [Routine] { active.filter { !RoutineStats.isScheduled($0, on: date) } }

    var body: some View {
        NavigationStack {
            List {
                if model.db.routines.isEmpty {
                    EmptyStartView { adding = $0 }
                } else {
                    Section { DayHeader(date: date) }
                    if let timer = model.db.timer, let r = model.db.routine(timer.routineId) {
                        Section { TimerBanner(routine: r, timer: timer) }
                    }
                    if scheduled.isEmpty {
                        Section {
                            Text(date < (model.db.earliestStart ?? date) ? "이 날은 루틴을 시작하기 전이에요." : "이 날 예정된 루틴이 없어요.")
                                .foregroundStyle(.secondary)
                        }
                    }
                    ForEach(RoutineSlot.allCases, id: \.self) { slot in
                        let items = scheduled.filter { $0.slot == slot }
                        if !items.isEmpty {
                            Section(slot.label) {
                                ForEach(items) { r in row(r) }
                            }
                        }
                    }
                    if !off.isEmpty {
                        Section {
                            DisclosureGroup(isExpanded: $showOff) {
                                ForEach(off) { r in row(r).opacity(0.75) }
                            } label: {
                                Text("이 날 쉬는 루틴 · \(off.count)").foregroundStyle(.secondary)
                            }
                        } footer: {
                            Text("쉬는 날에 해도 스트릭에는 들어가지 않아요.")
                        }
                    }
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle(isToday ? "오늘" : DayKey.label(date))
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        adding = RoutineTemplate.blank
                    } label: {
                        Image(systemName: "plus")
                    }
                }
                if model.syncing {
                    ToolbarItem(placement: .topBarLeading) { ProgressView() }
                }
            }
            .refreshable { await model.syncNow() }
            .onAppear {
                #if DEBUG
                if DemoData.sheet == "edit" { editing = model.db.sortedRoutines.first }
                if DemoData.sheet == "new" { adding = .blank }
                #endif
            }
            .sheet(item: $editing) { r in RoutineEditorView(routine: r, template: nil) }
            .sheet(item: $adding) { t in RoutineEditorView(routine: nil, template: t) }
            .alert("기록 시간", isPresented: Binding(get: { minutesFor != nil }, set: { if !$0 { minutesFor = nil } })) {
                TextField("분", text: $minutesText).keyboardType(.numberPad)
                Button("저장") {
                    if let r = minutesFor { model.setMinutes(r, on: date, minutes: Int(minutesText) ?? 0) }
                    minutesFor = nil
                }
                Button("취소", role: .cancel) { minutesFor = nil }
            } message: {
                Text("\(DayKey.label(date))에 쓴 시간을 분 단위로 적어 주세요.")
            }
        }
    }

    @ViewBuilder
    private func row(_ r: Routine) -> some View {
        RoutineRowView(routine: r, date: date)
            .contextMenu {
                Button {
                    minutesText = String((model.db.log(r.id, date)?.secs ?? 0) / 60)
                    minutesFor = r
                } label: {
                    Label("시간 직접 입력", systemImage: "clock")
                }
                Button {
                    editing = r
                } label: {
                    Label("편집", systemImage: "pencil")
                }
            }
    }
}

/// 날짜 이동 + 진행률
struct DayHeader: View {
    @EnvironmentObject var model: AppModel
    let date: String

    var body: some View {
        let s = RoutineStats.day(model.db.routines, model.db, date, today: model.today)
        let streak = RoutineStats.perfectStreak(model.db.routines, model.db, today: model.today)
        HStack(spacing: 14) {
            ProgressRing(progress: s.rate ?? 0, lineWidth: 7)
                .frame(width: 54, height: 54)
                .overlay {
                    Text(s.scheduled > 0 ? "\(s.done)/\(s.scheduled)" : "–")
                        .font(.footnote.weight(.semibold))
                        .monospacedDigit()
                }
            VStack(alignment: .leading, spacing: 3) {
                Text(date == model.today ? DayKey.label(date) : "지난 날 기록 고치기")
                    .font(.subheadline.weight(.semibold))
                Text(s.scheduled == 0 ? "예정 없음" : s.done == s.scheduled ? "모두 끝냈어요" : "\(s.scheduled - s.done)개 남음")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                if streak.current > 0 {
                    Label("모두 끝낸 날 \(streak.current)일 연속", systemImage: "flame.fill")
                        .font(.caption)
                        .foregroundStyle(Theme.ok)
                }
            }
            Spacer(minLength: 0)
            HStack(spacing: 4) {
                Button {
                    model.selectedDate = DayKey.add(date, -1)
                } label: {
                    Image(systemName: "chevron.left").frame(width: 32, height: 32)
                }
                .disabled(date <= (model.db.earliestStart ?? date))
                if date != model.today {
                    Button("오늘") { model.selectedDate = model.today }
                        .font(.footnote.weight(.semibold))
                }
                Button {
                    model.selectedDate = DayKey.add(date, 1)
                } label: {
                    Image(systemName: "chevron.right").frame(width: 32, height: 32)
                }
                .disabled(date >= model.today)
            }
            .buttonStyle(.borderless)
        }
        .padding(.vertical, 4)
    }
}

struct RoutineRowView: View {
    @EnvironmentObject var model: AppModel
    let routine: Routine
    let date: String

    var body: some View {
        let log = model.db.log(routine.id, date)
        let done = log?.done == true
        let running = model.db.timer?.routineId == routine.id && model.db.timer?.date == date
        let streak = RoutineStats.streak(routine, model.db, today: model.today)
        let canTime = date == model.today && !routine.isArchived
        HStack(spacing: 12) {
            Button {
                model.toggle(routine, on: date)
            } label: {
                ZStack {
                    Circle().strokeBorder(routine.color.color, lineWidth: 2.5)
                    if done {
                        Circle().fill(routine.color.color)
                        Image(systemName: "checkmark").font(.system(size: 13, weight: .bold)).foregroundStyle(Color(.systemBackground))
                    }
                }
                .frame(width: 28, height: 28)
                .contentShape(Circle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel(done ? "\(routine.title) 완료 취소" : "\(routine.title) 완료")

            VStack(alignment: .leading, spacing: 3) {
                Text(routine.title)
                    .strikethrough(done, color: .secondary)
                    .foregroundStyle(done ? .secondary : .primary)
                HStack(spacing: 6) {
                    Text(RoutineStats.describe(routine.schedule) + (routine.goalMin.map { " · 목표 \($0)분" } ?? ""))
                    if streak.current > 0 { StreakBadge(days: streak.current) }
                }
                .font(.caption)
                .foregroundStyle(.secondary)
            }
            Spacer(minLength: 0)
            TimeColumn(routine: routine, log: log, running: running)
            if canTime {
                Button {
                    model.toggleTimer(routine)
                } label: {
                    Image(systemName: running ? "stop.fill" : "play.fill")
                        .font(.system(size: 12, weight: .semibold))
                        .frame(width: 32, height: 32)
                        .background(running ? Theme.time.opacity(0.18) : Color(.tertiarySystemFill), in: RoundedRectangle(cornerRadius: 8))
                        .foregroundStyle(running ? Theme.time : .secondary)
                }
                .buttonStyle(.plain)
                .accessibilityLabel(running ? "타이머 멈추기" : "타이머 시작")
            }
        }
        .padding(.vertical, 2)
    }
}

/// 기록 시간 · 목표 진행. 타이머가 돌면 1초마다 다시 그린다.
struct TimeColumn: View {
    @EnvironmentObject var model: AppModel
    let routine: Routine
    let log: RoutineLog?
    let running: Bool

    var body: some View {
        let base = log?.secs ?? 0
        let goal = (routine.goalMin ?? 0) * 60
        if goal > 0 || base > 0 || running {
            TimelineView(.periodic(from: .now, by: 1)) { context in
                let secs = base + (running ? RoutineEngine.elapsed(model.db.timer, now: context.date) : 0)
                VStack(alignment: .trailing, spacing: 4) {
                    HStack(spacing: 2) {
                        Text(running ? RoutineStats.formatClock(secs) : RoutineStats.formatSecs(secs))
                            .foregroundStyle(.primary)
                        if goal > 0 { Text("/ \(routine.goalMin ?? 0)분").foregroundStyle(.secondary) }
                    }
                    .font(.caption.monospacedDigit())
                    if goal > 0 {
                        ProgressView(value: min(1, Double(secs) / Double(goal)))
                            .tint(secs >= goal ? Theme.ok : Theme.time)
                            .frame(width: 70)
                    }
                }
            }
        }
    }
}

struct TimerBanner: View {
    @EnvironmentObject var model: AppModel
    let routine: Routine
    let timer: RoutineTimer

    var body: some View {
        HStack(spacing: 10) {
            Circle().fill(routine.color.color).frame(width: 10, height: 10)
            VStack(alignment: .leading, spacing: 2) {
                Text(routine.title).font(.subheadline.weight(.semibold))
                if timer.date != model.selectedDate {
                    Text("\(DayKey.label(timer.date)) 기록 중").font(.caption).foregroundStyle(.secondary)
                }
            }
            Spacer()
            TimelineView(.periodic(from: .now, by: 1)) { context in
                Text(RoutineStats.formatClock(RoutineEngine.elapsed(timer, now: context.date)))
                    .font(.title3.monospacedDigit().weight(.semibold))
            }
            Button("멈추기") { model.stopTimer() }
                .buttonStyle(.borderedProminent)
                .tint(Theme.time)
                .controlSize(.small)
        }
        .listRowBackground(Theme.time.opacity(0.12))
    }
}

/// 🔥 n일 — 아이콘과 숫자를 붙여서 작게
struct StreakBadge: View {
    let days: Int

    var body: some View {
        HStack(spacing: 2) {
            Image(systemName: "flame.fill").imageScale(.small)
            Text("\(days)일").monospacedDigit()
        }
        .font(.caption)
        .foregroundStyle(Theme.ok)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(days)일 연속")
    }
}

struct ProgressRing: View {
    let progress: Double
    var lineWidth: CGFloat = 8

    var body: some View {
        ZStack {
            Circle().stroke(Theme.ok.opacity(0.18), lineWidth: lineWidth)
            Circle()
                .trim(from: 0, to: max(0, min(1, progress)))
                .stroke(Theme.ok, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
                .rotationEffect(.degrees(-90))
                .animation(.easeOut(duration: 0.4), value: progress)
        }
    }
}

struct EmptyStartView: View {
    let onPick: (RoutineTemplate) -> Void

    var body: some View {
        Section {
            VStack(alignment: .leading, spacing: 10) {
                Text("첫 루틴을 만들어 볼까요").font(.headline)
                Text("매일 체크하면 연속 기록과 요일별 패턴, 쓴 시간을 정리해 보여드려요. 목표 시간을 정하면 타이머로 채울 때 자동으로 완료돼요.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            .padding(.vertical, 6)
        }
        Section("예시로 시작") {
            ForEach(RoutineTemplate.examples) { t in
                Button {
                    onPick(t)
                } label: {
                    HStack {
                        Text(t.title)
                        Spacer()
                        Text(t.slot.label + (t.goalMin.map { " · \($0)분" } ?? "")).foregroundStyle(.secondary).font(.footnote)
                    }
                }
            }
            Button("직접 만들기") { onPick(.blank) }
                .fontWeight(.semibold)
        }
    }
}
