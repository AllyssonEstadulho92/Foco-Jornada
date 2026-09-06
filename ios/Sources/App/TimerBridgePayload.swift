import Foundation

struct TimerBridgePayload: Decodable {
    struct Journey: Decodable {
        let id: String
        let startedAt: String
    }

    struct Phase: Decodable {
        let kind: String
        let id: String
        let title: String
        let subtitle: String?
        let startedAt: String
        let deadlineAt: String?
        let remainingSeconds: Int?
        let state: String
    }

    let version: Int
    let command: String
    let journey: Journey?
    let phase: Phase?

    static func decode(messageBody: Any) throws -> TimerBridgePayload {
        guard JSONSerialization.isValidJSONObject(messageBody) else {
            throw TimerBridgeError.invalidPayload
        }
        let data = try JSONSerialization.data(withJSONObject: messageBody)
        return try JSONDecoder().decode(TimerBridgePayload.self, from: data)
    }
}

enum TimerBridgeError: Error {
    case invalidPayload
    case unsupportedContract
    case invalidIdentifier
    case invalidTimestamp
    case invalidDuration
}

enum TimerBridgeDates {
    private static let fractional = ISO8601DateFormatter()
    private static let basic = ISO8601DateFormatter()

    static func parse(_ value: String) -> Date? {
        fractional.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        basic.formatOptions = [.withInternetDateTime]
        return fractional.date(from: value) ?? basic.date(from: value)
    }
}
