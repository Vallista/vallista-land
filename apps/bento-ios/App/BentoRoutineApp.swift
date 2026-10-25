import SwiftUI

@main
struct BentoRoutineApp: App {
    @StateObject private var model = AppModel()
    @Environment(\.scenePhase) private var scenePhase

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(model)
        }
        .onChange(of: scenePhase) { _, phase in
            switch phase {
            case .active: model.becameActive()
            case .background: model.resignedActive()
            default: break
            }
        }
    }
}

struct RootView: View {
    @EnvironmentObject var model: AppModel

    var body: some View {
        TabView(selection: $model.tab) {
            TodayView()
                .tabItem { Label("오늘", systemImage: "checkmark.circle") }
                .tag(AppTab.today)
            StatsView()
                .tabItem { Label("기록", systemImage: "chart.bar") }
                .tag(AppTab.stats)
            RoutinesView()
                .tabItem { Label("루틴", systemImage: "list.bullet") }
                .tag(AppTab.routines)
            SettingsView()
                .tabItem { Label("설정", systemImage: "gearshape") }
                .tag(AppTab.settings)
        }
        .overlay(alignment: .top) {
            if let notice = model.notice {
                NoticeBanner(text: notice) { model.notice = nil }
                    .padding(.top, 4)
                    .transition(.move(edge: .top).combined(with: .opacity))
            }
        }
        .animation(.spring(duration: 0.3), value: model.notice)
    }
}

struct NoticeBanner: View {
    let text: String
    let onClose: () -> Void

    var body: some View {
        HStack(spacing: 10) {
            Text(text)
                .font(.subheadline)
                .foregroundStyle(.primary)
                .frame(maxWidth: .infinity, alignment: .leading)
            Button(action: onClose) {
                Image(systemName: "xmark").font(.caption.weight(.semibold))
            }
            .buttonStyle(.plain)
            .foregroundStyle(.secondary)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        .padding(.horizontal, 12)
        .task {
            try? await Task.sleep(nanoseconds: 4_000_000_000)
            onClose()
        }
    }
}
