import Foundation
import CryptoKit
import JavaScriptCore
import Vision

public struct CertivaReason: Codable, Identifiable {
    public let code: String
    public let title: String
    public var id: String { code }
}
public struct CertivaAssessment: Codable, Identifiable {
    public let id: String
    public let outcome: String
    public let title: String
    public let action: String
    public let reasons: [CertivaReason]
    public let channel: String
    public let source: String
    public let evaluatedAt: String
    public let policyVersion: String
    public let sdkVersion: String
    public let coverage: String

    // Only metadata leaves this SDK, and only when the host explicitly sends it.
    public func reportPayload(consent: Bool) throws -> Data {
        guard consent else { throw CertivaError.consentRequired }
        return try JSONSerialization.data(withJSONObject: [
            "assessmentId": id, "outcome": outcome,
            "reasonCodes": reasons.map(\.code), "channel": channel,
            "source": source, "evaluatedAt": evaluatedAt,
            "policyVersion": policyVersion, "sdkVersion": sdkVersion,
            "consent": true
        ], options: [.sortedKeys])
    }
}
public enum CertivaError: LocalizedError {
    case invalidPolicy, invalidInput, consentRequired, unreadableImage
    public var errorDescription: String? {
        switch self {
        case .invalidPolicy: return "No se pudo verificar la configuración de Certiva."
        case .invalidInput: return "No se pudo analizar el contenido. Revisa el texto e inténtalo de nuevo."
        case .consentRequired: return "Confirma los datos antes de enviar el reporte."
        case .unreadableImage: return "No pudimos leer esta imagen. Prueba una captura más clara."
        }
    }
}

@MainActor
public final class CertivaEngine {
    private let context: JSContext
    private let policy: [String: Any]

    public init() throws {
        guard let context = JSContext(),
              let scriptURL = Bundle.module.url(forResource: "certiva", withExtension: "js"),
              let policyURL = Bundle.module.url(forResource: "policy", withExtension: "json"),
              let keyURL = Bundle.module.url(forResource: "policy-key", withExtension: "txt") else {
            throw CertivaError.invalidPolicy
        }
        let key = try String(contentsOf: keyURL, encoding: .utf8).trimmingCharacters(in: .whitespacesAndNewlines)
        self.policy = try Self.verifyPolicy(envelope: Data(contentsOf: policyURL), pinnedKey: key)
        self.context = context
        context.evaluateScript(try String(contentsOf: scriptURL, encoding: .utf8))
        guard context.exception == nil else { throw CertivaError.invalidPolicy }
        context.objectForKeyedSubscript("Certiva")?.invokeMethod("validatePolicy", withArguments: [policy])
        guard context.exception == nil else { throw CertivaError.invalidPolicy }
    }

    static func verifyPolicy(envelope: Data, pinnedKey: String) throws -> [String: Any] {
        guard let wrapper = try JSONSerialization.jsonObject(with: envelope) as? [String: String],
              let payloadText = wrapper["payload"], let signatureText = wrapper["signature"],
              let payload = Data(base64Encoded: payloadText), let signature = Data(base64Encoded: signatureText),
              let rawKey = Data(base64Encoded: pinnedKey),
              let key = try? Curve25519.Signing.PublicKey(rawRepresentation: rawKey),
              key.isValidSignature(signature, for: payload),
              let policy = try JSONSerialization.jsonObject(with: payload) as? [String: Any] else {
            throw CertivaError.invalidPolicy
        }
        return policy
    }

    public func assess(text: String, channel: String = "whatsapp", source: String = "texto",
                       readingConfirmed: Bool = false, now: Date = Date()) throws -> CertivaAssessment {
        context.exception = nil
        let input: [String: Any] = ["id": UUID().uuidString.lowercased(), "text": text,
            "channel": channel, "source": source, "readingConfirmed": readingConfirmed,
            "now": now.timeIntervalSince1970 * 1000]
        let output = context.objectForKeyedSubscript("Certiva")?.invokeMethod("assess", withArguments: [input, policy])
        guard context.exception == nil, let dictionary = output?.toDictionary() else { throw CertivaError.invalidInput }
        return try JSONDecoder().decode(CertivaAssessment.self, from: JSONSerialization.data(withJSONObject: dictionary))
    }

    // No HTTP, logging, file persistence or photo library enumeration.
    // The host supplies one user-selected image and reviews extracted text before assessment.
    public nonisolated static func readImage(_ data: Data) async throws -> String {
        guard !data.isEmpty, data.count <= 10 * 1024 * 1024 else { throw CertivaError.unreadableImage }
        return try await Task.detached(priority: .userInitiated) {
            let request = VNRecognizeTextRequest()
            request.recognitionLevel = .accurate
            request.recognitionLanguages = ["es", "en"]
            request.usesLanguageCorrection = false
            try VNImageRequestHandler(data: data, options: [:]).perform([request])
            let text = (request.results ?? []).compactMap { $0.topCandidates(1).first?.string }.joined(separator: "\n")
            guard text.count >= 12, text.count <= 12000 else { throw CertivaError.unreadableImage }
            return text
        }.value
    }
}
