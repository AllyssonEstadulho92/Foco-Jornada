import ActivityKit
import AlarmKit
import Foundation
import SwiftUI
import UserNotifications

@MainActor
final class NativeTimerCoordinator {
    static let shared = NativeTimerCoordinator()

    private let defaults = UserDefaults.standard
    private let alarmPhaseKey = "foco-jornada.native-alarm.phase-id"
    private let alarmUUIDKey = "foco-jornada.native-alarm.uuid"
    private let alarmDeadlineKey = "foco-jornada.native-alarm.deadline"
    private let fallbackNotificationKey = "foco-jornada.native-fallback"
    private let maximumCountdown: TimeInterval = 7 * 24 * 60 * 60

    private init() {}

    func apply(_ payload: TimerBridgePayload) async {
        guard payload.version == 1, payload.command == "sync" else { return }

        guard let journey = payload.journey,
              isValidIdentifier(journey.id),
              let journeyStartedAt = TimerBridgeDates.parse(journey.startedAt) else {
            await clearNativePresentation()
            return
        }

        var validatedPhase: ValidatedPhase?
        if let phase = payload.phase {
            validatedPhase = validate(phase)
        }

        if let phase = validatedPhase,
           phase.state == "running",
           let deadline = phase.deadlineAt,
           deadline > Date() {
            let scheduled = await scheduleSystemCountdown(phase: phase, deadline: deadline)
            if scheduled {
                await Self.endJourneyLiveActivities()
                return
            }

            await scheduleFallbackNotification(phase: phase, deadline: deadline)
        } else {
            await cancelCurrentAlarm()
            cancelFallbackNotification()
        }

        await Self.showJourneyLiveActivity(
            journeyID: journey.id,
            journeyStartedAt: journeyStartedAt,
            phase: validatedPhase
        )
    }

    private struct ValidatedPhase: Sendable {
        let kind: String
        let id: String
        let title: String
        let subtitle: String?
        let startedAt: Date
        let deadlineAt: Date?
        let remainingSeconds: Int?
        let state: String
    }

    private func validate(_ phase: TimerBridgePayload.Phase) -> ValidatedPhase? {
        guard (phase.kind == "focus" || phase.kind == "break"),
              (phase.state == "running" || phase.state == "paused"),
              isValidIdentifier(phase.id),
              !phase.title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
              let startedAt = TimerBridgeDates.parse(phase.startedAt) else {
            return nil
        }

        var deadline: Date?
        if let rawDeadline = phase.deadlineAt {
            guard let parsed = TimerBridgeDates.parse(rawDeadline) else { return nil }
            let duration = parsed.timeIntervalSinceNow
            guard duration <= maximumCountdown else { return nil }
            deadline = parsed
        }

        if let remaining = phase.remainingSeconds,
           (remaining < 0 || TimeInterval(remaining) > maximumCountdown) {
            return nil
        }

        return ValidatedPhase(
            kind: phase.kind,
            id: phase.id,
            title: String(phase.title.prefix(80)),
            subtitle: phase.subtitle.map { String($0.prefix(120)) },
            startedAt: startedAt,
            deadlineAt: deadline,
            remainingSeconds: phase.remainingSeconds,
            state: phase.state
        )
    }

    private func isValidIdentifier(_ value: String) -> Bool {
        guard !value.isEmpty, value.count <= 128 else { return false }
        return value.unicodeScalars.allSatisfy {
            CharacterSet.alphanumerics.contains($0) || "-_.:".unicodeScalars.contains($0)
        }
    }

    private nonisolated static func showJourneyLiveActivity(
        journeyID: String,
        journeyStartedAt: Date,
        phase: ValidatedPhase?
    ) async {
        guard ActivityAuthorizationInfo().areActivitiesEnabled else { return }

        let state = JourneyTimerAttributes.ContentState(
            title: phase?.title ?? "Jornada em curso",
            subtitle: phase?.subtitle,
            phaseKind: phase?.kind ?? "journey",
            startedAt: phase?.startedAt ?? journeyStartedAt,
            deadlineAt: phase?.deadlineAt,
            remainingSeconds: phase?.remainingSeconds,
            isPaused: phase?.state == "paused"
        )
        let content = ActivityContent(state: state, staleDate: phase?.deadlineAt)

        let matching = Activity<JourneyTimerAttributes>.activities.first {
            $0.attributes.journeyID == journeyID
        }

        for activity in Activity<JourneyTimerAttributes>.activities where activity.id != matching?.id {
            await activity.end(nil, dismissalPolicy: .immediate)
        }

        if let matching {
            await matching.update(content)
            return
        }

        do {
            _ = try Activity<JourneyTimerAttributes>.request(
                attributes: JourneyTimerAttributes(journeyID: journeyID),
                content: content,
                pushType: nil
            )
        } catch {
            // A aplicação Web mantém-se como fonte de verdade mesmo sem Live Activities.
        }
    }

    private nonisolated static func endJourneyLiveActivities() async {
        for activity in Activity<JourneyTimerAttributes>.activities {
            await activity.end(nil, dismissalPolicy: .immediate)
        }
    }

    private func clearNativePresentation() async {
        await cancelCurrentAlarm()
        cancelFallbackNotification()
        await Self.endJourneyLiveActivities()
    }

    private func cancelFallbackNotification() {
        UNUserNotificationCenter.current().removePendingNotificationRequests(
            withIdentifiers: [fallbackNotificationKey]
        )
    }

    private func scheduleFallbackNotification(phase: ValidatedPhase, deadline: Date) async {
        let center = UNUserNotificationCenter.current()
        let authorizationStatus = await withCheckedContinuation {
            (continuation: CheckedContinuation<UNAuthorizationStatus, Never>) in
            center.getNotificationSettings { settings in
                continuation.resume(returning: settings.authorizationStatus)
            }
        }

        guard authorizationStatus == .authorized || authorizationStatus == .provisional else {
            return
        }

        cancelFallbackNotification()
        let content = UNMutableNotificationContent()
        content.title = phase.kind == "break" ? "Pausa concluída" : "Foco concluído"
        content.body = phase.title
        content.sound = .default

        let remaining = max(1, deadline.timeIntervalSinceNow)
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: remaining, repeats: false)
        let request = UNNotificationRequest(
            identifier: fallbackNotificationKey,
            content: content,
            trigger: trigger
        )
        try? await center.add(request)
    }

    private func currentAlarmID() -> UUID? {
        guard let raw = defaults.string(forKey: alarmUUIDKey) else { return nil }
        return UUID(uuidString: raw)
    }

    private func cancelCurrentAlarm() async {
        if #available(iOS 26.0, *), let id = currentAlarmID() {
            try? AlarmManager.shared.cancel(id: id)
        }
        defaults.removeObject(forKey: alarmPhaseKey)
        defaults.removeObject(forKey: alarmUUIDKey)
        defaults.removeObject(forKey: alarmDeadlineKey)
    }

    private func scheduleSystemCountdown(phase: ValidatedPhase, deadline: Date) async -> Bool {
        guard #available(iOS 26.0, *) else { return false }
        let alarmManager = AlarmManager.shared

        let deadlineKey = ISO8601DateFormatter().string(from: deadline)
        if defaults.string(forKey: alarmPhaseKey) == phase.id,
           defaults.string(forKey: alarmDeadlineKey) == deadlineKey,
           currentAlarmID() != nil {
            return true
        }

        await cancelCurrentAlarm()

        switch alarmManager.authorizationState {
        case .notDetermined:
            do {
                guard try await alarmManager.requestAuthorization() == .authorized else { return false }
            } catch {
                return false
            }
        case .authorized:
            break
        case .denied:
            return false
        @unknown default:
            return false
        }

        let remaining = deadline.timeIntervalSinceNow
        guard remaining > 0, remaining <= maximumCountdown else { return false }

        let alarmID = UUID()
        let stopButton = AlarmButton(
            text: "Fechar",
            textColor: .white,
            systemImageName: "xmark.circle.fill"
        )
        let alertTitle: LocalizedStringResource = phase.kind == "break"
            ? "Pausa concluída"
            : "Foco concluído"
        let countdownTitle: LocalizedStringResource = phase.kind == "break"
            ? "Pausa"
            : "Foco"
        let alert = AlarmPresentation.Alert(title: alertTitle, stopButton: stopButton)
        let countdown = AlarmPresentation.Countdown(title: countdownTitle)
        let attributes = AlarmAttributes<FocoJornadaAlarmMetadata>(
            presentation: AlarmPresentation(alert: alert, countdown: countdown),
            metadata: FocoJornadaAlarmMetadata(title: phase.title, kind: phase.kind),
            tintColor: .green
        )
        typealias AlarmConfiguration = AlarmManager.AlarmConfiguration<FocoJornadaAlarmMetadata>
        let duration = Alarm.CountdownDuration(preAlert: remaining, postAlert: remaining)
        let configuration = AlarmConfiguration(
            countdownDuration: duration,
            attributes: attributes
        )

        do {
            _ = try await alarmManager.schedule(id: alarmID, configuration: configuration)
            defaults.set(phase.id, forKey: alarmPhaseKey)
            defaults.set(alarmID.uuidString, forKey: alarmUUIDKey)
            defaults.set(deadlineKey, forKey: alarmDeadlineKey)
            cancelFallbackNotification()
            return true
        } catch {
            return false
        }
    }
}
