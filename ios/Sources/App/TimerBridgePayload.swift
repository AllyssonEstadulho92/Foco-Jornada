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
}

enum TimerBridgeDates {
    static func parse(_ value: String) -> Date? {
        let fractional = ISO8601DateFormatter()
        fractional.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = fractional.date(from: value) { return date }

        let basic = ISO8601DateFormatter()
        basic.formatOptions = [.withInternetDateTime]
        return basic.date(from: value)
    }
}
