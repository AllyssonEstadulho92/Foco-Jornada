import ActivityKit
import AlarmKit
import SwiftUI
import WidgetKit

@available(iOS 26.0, *)
struct AlarmCountdownLiveActivityWidget: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: AlarmAttributes<FocoJornadaAlarmMetadata>.self) { context in
            HStack(spacing: 14) {
                Image(systemName: iconName(context))
                    .font(.title2)
                    .frame(width: 36, height: 36)

                VStack(alignment: .leading, spacing: 3) {
                    Text(context.attributes.metadata?.title ?? "Foco & Jornada")
                        .font(.headline)
                        .lineLimit(1)
                    Text(statusLabel(context))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Spacer(minLength: 8)
                alarmTimer(context)
                    .font(.title2.monospacedDigit().weight(.semibold))
            }
            .padding()
            .activityBackgroundTint(.black.opacity(0.94))
            .activitySystemActionForegroundColor(.white)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Label(
                        context.attributes.metadata?.title ?? "Foco & Jornada",
                        systemImage: iconName(context)
                    )
                    .font(.headline)
                    .lineLimit(1)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    alarmTimer(context)
                        .font(.title2.monospacedDigit().weight(.semibold))
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text(statusLabel(context))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            } compactLeading: {
                Image(systemName: iconName(context))
            } compactTrailing: {
                alarmTimer(context)
                    .font(.caption.monospacedDigit())
                    .frame(maxWidth: 54)
            } minimal: {
                Image(systemName: iconName(context))
            }
        }
    }

    private func iconName(_ context: ActivityViewContext<AlarmAttributes<FocoJornadaAlarmMetadata>>) -> String {
        context.attributes.metadata?.kind == "break" ? "cup.and.saucer.fill" : "scope"
    }

    private func statusLabel(_ context: ActivityViewContext<AlarmAttributes<FocoJornadaAlarmMetadata>>) -> String {
        switch context.state.mode {
        case .countdown:
            return context.attributes.metadata?.kind == "break" ? "Pausa em curso" : "Foco em curso"
        case .paused:
            return "Em pausa"
        case .alert:
            return "Tempo concluído"
        @unknown default:
            return "Foco & Jornada"
        }
    }

    @ViewBuilder
    private func alarmTimer(_ context: ActivityViewContext<AlarmAttributes<FocoJornadaAlarmMetadata>>) -> some View {
        switch context.state.mode {
        case .countdown(let countdown):
            Text(countdown.fireDate, style: .timer)
        case .paused:
            Text("Pausa")
        case .alert:
            Text("00:00")
        @unknown default:
            Text("—")
        }
    }
}
