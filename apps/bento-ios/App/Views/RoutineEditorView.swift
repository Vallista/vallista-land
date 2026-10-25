import RoutineKit
import SwiftUI

/// 새 루틴의 출발점. `blank` 는 빈 칸.
struct RoutineTemplate: Identifiable, Equatable {
    var id: String
    var title: String
    var color: RoutineColor
    var slot: RoutineSlot
    var schedule: RoutineSchedule
    var goalMin: Int?

    static let blank = RoutineTemplate(id: "blank", title: "", color: .blue, slot: .anytime, schedule: .daily, goalMin: nil)

    static let examples: [RoutineTemplate] = [
        RoutineTemplate(id: "water", title: "물 한 잔", color: .aqua, slot: .morning, schedule: .daily, goalMin: nil),
        RoutineTemplate(id: "stretch", title: "스트레칭", color: .orange, slot: .morning, schedule: .daily, goalMin: 10),
        RoutineTemplate(id: "read", title: "독서", color: .violet, slot: .evening, schedule: .daily, goalMin: 30),
        RoutineTemplate(id: "meditate", title: "명상", color: .blue, slot: .anytime, schedule: .daily, goalMin: 10),
        RoutineTemplate(
            id: "workout", title: "운동", color: .magenta, slot: .afternoon,
            schedule: RoutineSchedule(freq: .weekly, weekdays: [1, 3, 5]), goalMin: 40
        ),
        RoutineTemplate(id: "journal", title: "일기", color: .yellow, slot: .evening, schedule: .daily, goalMin: nil),
    ]
}

struct RoutineEditorView: View {
    @EnvironmentObject var model: AppModel
    @Environment(\.dismiss) private var dismiss

    let routine: Routine?
    let template: RoutineTemplate?

    @State private var title = ""
    @State private var color: RoutineColor = .blue
    @State private var slot: RoutineSlot = .anytime
    @State private var weekly = false
    @State private var weekdays: Set<Int> = []
    @State private var hasGoal = false
    @State private var goalMin = 20
    @State private var startDate = Date()
    @State private var confirmDelete = false
    @State private var loaded = false

    private var isNew: Bool { routine == nil }
    private var dayOrder: [Int] { model.mondayFirst ? [1, 2, 3, 4, 5, 6, 0] : [0, 1, 2, 3, 4, 5, 6] }
    private var trimmed: String { title.trimmingCharacters(in: .whitespacesAndNewlines) }
    private var canSave: Bool { !trimmed.isEmpty && (!weekly || !weekdays.isEmpty) }

    var body: some View {
        NavigationStack {
            Form {
                if isNew && (template == nil || template == .blank) {
                    Section("예시") {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(RoutineTemplate.examples) { t in
                                    Button {
                                        apply(t)
                                    } label: {
                                        HStack(spacing: 6) {
                                            Circle().fill(t.color.color).frame(width: 8, height: 8)
                                            Text(t.title)
                                        }
                                        .font(.subheadline)
                                        .padding(.horizontal, 12)
                                        .padding(.vertical, 7)
                                        .background(Color(.tertiarySystemFill), in: Capsule())
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                            .padding(.vertical, 2)
                        }
                    }
                }

                Section {
                    TextField("이름 (예: 독서 30분)", text: $title)
                        .submitLabel(.done)
                    ColorRow(selection: $color)
                }

                Section("시간대") {
                    Picker("시간대", selection: $slot) {
                        ForEach(RoutineSlot.allCases, id: \.self) { Text($0.label).tag($0) }
                    }
                    .pickerStyle(.segmented)
                    .labelsHidden()
                }

                Section {
                    Picker("반복", selection: $weekly) {
                        Text("매일").tag(false)
                        Text("요일 선택").tag(true)
                    }
                    .pickerStyle(.segmented)
                    .labelsHidden()
                    if weekly {
                        HStack(spacing: 6) {
                            ForEach(dayOrder, id: \.self) { d in
                                let on = weekdays.contains(d)
                                Button {
                                    if on { weekdays.remove(d) } else { weekdays.insert(d) }
                                } label: {
                                    Text(RoutineStats.weekdayLabel(d))
                                        .font(.subheadline.weight(on ? .semibold : .regular))
                                        .frame(maxWidth: .infinity, minHeight: 34)
                                        .background(on ? color.color.opacity(0.22) : Color(.tertiarySystemFill), in: RoundedRectangle(cornerRadius: 8))
                                        .foregroundStyle(on ? .primary : .secondary)
                                }
                                .buttonStyle(.plain)
                                .accessibilityAddTraits(on ? .isSelected : [])
                            }
                        }
                        HStack(spacing: 8) {
                            Button("평일") { weekdays = [1, 2, 3, 4, 5] }
                            Button("주말") { weekdays = [0, 6] }
                        }
                        .font(.footnote)
                        .buttonStyle(.bordered)
                    }
                } header: {
                    Text("반복")
                } footer: {
                    if weekly && weekdays.isEmpty { Text("요일을 하나 이상 골라 주세요.").foregroundStyle(Theme.bad) }
                }

                Section {
                    Toggle("목표 시간", isOn: $hasGoal.animation())
                    if hasGoal {
                        Stepper(value: $goalMin, in: 1...600, step: goalMin < 10 ? 1 : 5) {
                            Text("하루 \(goalMin)분")
                        }
                    }
                } footer: {
                    Text(hasGoal ? "타이머나 직접 입력으로 목표 시간을 채우면 자동으로 완료돼요." : "시간을 재지 않는 루틴이면 꺼 두세요. 타이머는 언제든 쓸 수 있어요.")
                }

                Section {
                    DatePicker("시작일", selection: $startDate, displayedComponents: .date)
                } footer: {
                    Text("시작일 전 날짜는 통계에 넣지 않아요.")
                }

                if let r = routine {
                    Section {
                        Button(r.isArchived ? "보관에서 꺼내기" : "보관하기") {
                            model.setArchived(r, !r.isArchived)
                            dismiss()
                        }
                        Button("삭제", role: .destructive) { confirmDelete = true }
                    } footer: {
                        Text(r.isArchived
                            ? "꺼내면 보관해 둔 기간은 놓친 날로 세지 않아요."
                            : "보관하면 오늘부터 예정에서 빠지고, 지난 기록과 통계는 남아요.")
                    }
                }
            }
            .navigationTitle(isNew ? "새 루틴" : "루틴 편집")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("취소") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(isNew ? "추가" : "저장") { save() }
                        .disabled(!canSave)
                }
            }
            .confirmationDialog("‘\(routine?.title ?? "")’을 삭제할까요?", isPresented: $confirmDelete, titleVisibility: .visible) {
                Button("루틴과 기록 모두 삭제", role: .destructive) {
                    if let r = routine { model.delete(r) }
                    dismiss()
                }
            } message: {
                Text("지난 기록도 함께 지워지고 되돌릴 수 없어요. 기록을 남기려면 보관하세요.")
            }
            .onAppear(perform: load)
        }
    }

    private func load() {
        guard !loaded else { return }
        loaded = true
        if let r = routine {
            title = r.title
            color = r.color
            slot = r.slot
            weekly = r.schedule.freq == .weekly
            weekdays = Set(r.schedule.weekdays)
            hasGoal = r.goalMin != nil
            goalMin = r.goalMin ?? 20
            startDate = DayKey.date(r.startDate) ?? Date()
        } else {
            apply(template ?? .blank)
            // 다음 색을 골라 두면 목록에서 서로 구분된다.
            if template == nil || template == .blank {
                let used = Set(model.db.activeRoutines.map(\.color))
                color = RoutineColor.allCases.first { !used.contains($0) } ?? .blue
            }
        }
    }

    private func apply(_ t: RoutineTemplate) {
        if !t.title.isEmpty { title = t.title }
        color = t.color
        slot = t.slot
        weekly = t.schedule.freq == .weekly
        weekdays = Set(t.schedule.weekdays)
        hasGoal = t.goalMin != nil
        goalMin = t.goalMin ?? 20
    }

    private func save() {
        let schedule = weekly ? RoutineSchedule(freq: .weekly, weekdays: weekdays.sorted()) : .daily
        let input = RoutineInput(
            title: trimmed,
            color: color,
            slot: slot,
            schedule: schedule,
            goalMin: hasGoal ? goalMin : nil,
            startDate: DayKey.key(startDate)
        )
        let ok = routine.map { model.update($0.id, input) } ?? model.add(input)
        if ok { dismiss() }
    }
}

struct ColorRow: View {
    @Binding var selection: RoutineColor

    var body: some View {
        HStack {
            Text("색")
            Spacer()
            HStack(spacing: 10) {
                ForEach(RoutineColor.allCases, id: \.self) { c in
                    Button {
                        selection = c
                    } label: {
                        Circle()
                            .fill(c.color)
                            .frame(width: 26, height: 26)
                            .overlay {
                                if selection == c {
                                    Circle().strokeBorder(Color(.systemBackground), lineWidth: 2.5)
                                    Circle().strokeBorder(c.color, lineWidth: 1).padding(-3)
                                }
                            }
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(c.label)
                    .accessibilityAddTraits(selection == c ? .isSelected : [])
                }
            }
        }
    }
}
