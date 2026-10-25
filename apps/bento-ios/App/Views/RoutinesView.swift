import RoutineKit
import SwiftUI

/// 루틴 관리 — 순서 바꾸기, 보관, 삭제.
struct RoutinesView: View {
    @EnvironmentObject var model: AppModel
    @State private var editing: Routine?
    @State private var adding: RoutineTemplate?
    @State private var deleting: Routine?

    private var active: [Routine] { model.db.activeRoutines }
    private var archived: [Routine] { model.db.sortedRoutines.filter(\.isArchived) }

    var body: some View {
        NavigationStack {
            List {
                if model.db.routines.isEmpty {
                    EmptyStartView { adding = $0 }
                }
                if !active.isEmpty {
                    Section {
                        ForEach(active) { r in
                            Button {
                                editing = r
                            } label: {
                                ManageRow(routine: r)
                            }
                            .buttonStyle(.plain)
                            .swipeActions(edge: .trailing) {
                                Button(role: .destructive) {
                                    deleting = r
                                } label: {
                                    Label("삭제", systemImage: "trash")
                                }
                                Button {
                                    model.setArchived(r, true)
                                } label: {
                                    Label("보관", systemImage: "archivebox")
                                }
                                .tint(.gray)
                            }
                        }
                        .onMove { model.move(from: $0, to: $1) }
                    } header: {
                        Text("진행 중 · \(active.count)")
                    } footer: {
                        Text("길게 눌러 끌면 순서가 바뀌어요. 왼쪽으로 밀면 보관·삭제.")
                    }
                }
                if !archived.isEmpty {
                    Section("보관함 · \(archived.count)") {
                        ForEach(archived) { r in
                            Button {
                                editing = r
                            } label: {
                                ManageRow(routine: r)
                            }
                            .buttonStyle(.plain)
                            .swipeActions(edge: .trailing) {
                                Button(role: .destructive) {
                                    deleting = r
                                } label: {
                                    Label("삭제", systemImage: "trash")
                                }
                                Button {
                                    model.setArchived(r, false)
                                } label: {
                                    Label("꺼내기", systemImage: "tray.and.arrow.up")
                                }
                                .tint(Theme.time)
                            }
                        }
                    }
                }
            }
            .navigationTitle("루틴")
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    if !active.isEmpty { EditButton() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        adding = .blank
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(item: $editing) { r in RoutineEditorView(routine: r, template: nil) }
            .sheet(item: $adding) { t in RoutineEditorView(routine: nil, template: t) }
            .confirmationDialog(
                "‘\(deleting?.title ?? "")’을 삭제할까요?",
                isPresented: Binding(get: { deleting != nil }, set: { if !$0 { deleting = nil } }),
                titleVisibility: .visible
            ) {
                Button("루틴과 기록 모두 삭제", role: .destructive) {
                    if let r = deleting { model.delete(r) }
                    deleting = nil
                }
            } message: {
                Text("지난 기록도 함께 지워지고 되돌릴 수 없어요. 기록을 남기려면 보관하세요.")
            }
        }
    }
}

struct ManageRow: View {
    @EnvironmentObject var model: AppModel
    let routine: Routine

    var body: some View {
        let streak = RoutineStats.streak(routine, model.db, today: model.today)
        HStack(spacing: 12) {
            Circle().fill(routine.color.color).frame(width: 10, height: 10)
            VStack(alignment: .leading, spacing: 3) {
                Text(routine.title).foregroundStyle(routine.isArchived ? .secondary : .primary)
                Text(detail).font(.caption).foregroundStyle(.secondary)
            }
            Spacer(minLength: 0)
            if !routine.isArchived && streak.current > 0 {
                Label("\(streak.current)일", systemImage: "flame.fill")
                    .font(.caption)
                    .foregroundStyle(Theme.ok)
            }
            Image(systemName: "chevron.right").font(.caption).foregroundStyle(.tertiary)
        }
        .contentShape(Rectangle())
    }

    private var detail: String {
        var bits = [routine.slot.label, RoutineStats.describe(routine.schedule)]
        if let g = routine.goalMin { bits.append("\(g)분") }
        if let a = routine.archivedAt { bits.append("\(DayKey.label(a)) 보관") }
        return bits.joined(separator: " · ")
    }
}
