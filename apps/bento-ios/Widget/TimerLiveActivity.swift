import ActivityKit
import AppIntents
import RoutineKit
import SwiftUI
import WidgetKit

/// 잠금화면 · 다이내믹 아일랜드 타이머. 시각은 시스템이 그린다(`Text(_:style: .timer)`) — 앱이 깨어 있지 않아도 흐른다.
struct TimerLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: RoutineActivityAttributes.self) { context in
            TimerLockScreenView(context: context)
                .padding(16)
                .activityBackgroundTint(Color(.systemBackground).opacity(0.85))
        } dynamicIsland: { context in
            let color = (RoutineColor(rawValue: context.attributes.color) ?? .blue).color
            let start = TimerMath.displayStart(context.state)
            return DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    HStack(spacing: 6) {
                        Circle().fill(color).frame(width: 9, height: 9)
                        Text(context.attributes.title).font(.subheadline.weight(.semibold)).lineLimit(1)
                    }
                    .padding(.leading, 4)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text(start, style: .timer)
                        .font(.title3.monospacedDigit().weight(.semibold))
                        .multilineTextAlignment(.trailing)
                        .frame(maxWidth: 90, alignment: .trailing)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    HStack(spacing: 12) {
                        GoalProgress(state: context.state, color: color)
                        StopButton()
                    }
                }
            } compactLeading: {
                Circle().fill(color).frame(width: 10, height: 10)
            } compactTrailing: {
                Text(start, style: .timer)
                    .monospacedDigit()
                    .multilineTextAlignment(.trailing)
                    .frame(maxWidth: 52)
            } minimal: {
                Image(systemName: "timer").foregroundStyle(color)
            }
        }
    }
}

enum TimerMath {
    /// 그날 이미 쌓인 시간만큼 앞당긴 시작 시각 — `.timer` 가 그날 합계를 센다.
    static func displayStart(_ s: RoutineActivityAttributes.ContentState) -> Date {
        s.startedAt.addingTimeInterval(-Double(s.baseSecs))
    }
}

struct TimerLockScreenView: View {
    let context: ActivityViewContext<RoutineActivityAttributes>

    var body: some View {
        let color = (RoutineColor(rawValue: context.attributes.color) ?? .blue).color
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 10) {
                Circle().fill(color).frame(width: 10, height: 10)
                Text(context.attributes.title).font(.headline).lineLimit(1)
                Spacer()
                Text(TimerMath.displayStart(context.state), style: .timer)
                    .font(.title2.monospacedDigit().weight(.semibold))
                    .multilineTextAlignment(.trailing)
                    .frame(maxWidth: 110, alignment: .trailing)
            }
            HStack(spacing: 12) {
                GoalProgress(state: context.state, color: color)
                StopButton()
            }
        }
    }
}

struct GoalProgress: View {
    let state: RoutineActivityAttributes.ContentState
    let color: Color

    var body: some View {
        if let goal = state.goalSecs, goal > 0 {
            let start = TimerMath.displayStart(state)
            VStack(alignment: .leading, spacing: 4) {
                ProgressView(timerInterval: start...start.addingTimeInterval(Double(goal)), countsDown: false) {
                    EmptyView()
                } currentValueLabel: {
                    EmptyView()
                }
                .tint(color)
                Text("목표 \(goal / 60)분 · 멈추면 기록돼요").font(.caption2).foregroundStyle(.secondary)
            }
        } else {
            Text("목표 없이 기록 중").font(.caption).foregroundStyle(.secondary)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

struct StopButton: View {
    var body: some View {
        Button(intent: StopRoutineTimerIntent()) {
            Label("멈추기", systemImage: "stop.fill")
                .font(.caption.weight(.semibold))
                .padding(.horizontal, 12)
                .padding(.vertical, 7)
                .background(Theme.time.opacity(0.2), in: Capsule())
                .foregroundStyle(Theme.time)
        }
        .buttonStyle(.plain)
    }
}
