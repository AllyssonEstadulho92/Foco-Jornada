import ActivityKit
import SwiftUI
import WidgetKit

struct JourneyLiveActivityWidget: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: JourneyTimerAttributes.self) { context in
            HStack(spacing: 14) {
                Image(systemName: iconName(for: context.state.phaseKind))
                    .font(.title2)
                    .frame(width: 36, height: 36)

                VStack(alignment: .leading, spacing: 3) {
                    Text(context.state.title)
                        .font(.headline)
                        .lineLimit(1)
                    if let subtitle = context.state.subtitle {
                        Text(subtitle)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .lineLimit(1)
                    }
                }

                Spacer(minLength: 8)
                timerView(context.state)
                    .font(.title3.monospacedDigit().weight(.semibold))
            }
            .padding()
            .activityBackgroundTint(.black.opacity(0.94))
            .activitySystemActionForegroundColor(.white)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Label(context.state.title, systemImage: iconName(for: context.state.phaseKind))
                        .font(.headline)
                        .lineLimit(1)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    timerView(context.state)
                        .font(.title3.monospacedDigit().weight(.semibold))
                }
                DynamicIslandExpandedRegion(.bottom) {
                    if let subtitle = context.state.subtitle {
                        Text(subtitle)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    } else {
                        Text("Foco & Jornada")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            } compactLeading: {
                Image(systemName: iconName(for: context.state.phaseKind))
            } compactTrailing: {
                timerView(context.state)
                    .font(.caption.monospacedDigit())
                    .frame(maxWidth: 54)
            } minimal: {
                Image(systemName: iconName(for: context.state.phaseKind))
            }
        }
    }

    private func iconName(for phaseKind: String) -> String {
        switch phaseKind {
        case "break": "cup.and.saucer.fill"
        case "focus": "scope"
        default: "clock.fill"
        }
    }

    @ViewBuilder
    private func timerView(_ state: JourneyTimerAttributes.ContentState) -> some View {
        if state.isPaused, let remaining = state.remainingSeconds {
            Text(format(seconds: remaining))
        } else if let deadline = state.deadlineAt, deadline > Date() {
            Text(deadline, style: .timer)
        } else {
            Text(state.startedAt, style: .timer)
        }
    }

    private func format(seconds: Int) -> String {
        let value = max(0, seconds)
        let hours = value / 3600
        let minutes = (value % 3600) / 60
        let seconds = value % 60
        return hours > 0
            ? String(format: "%02d:%02d:%02d", hours, minutes, seconds)
            : String(format: "%02d:%02d", minutes, seconds)
    }
}
