import ActivityKit
import Foundation

struct JourneyTimerAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable {
        let title: String
        let subtitle: String?
        let phaseKind: String
        let startedAt: Date
        let deadlineAt: Date?
        let remainingSeconds: Int?
        let isPaused: Bool
    }

    let journeyID: String
}
