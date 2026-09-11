import XCTest
import CryptoKit
@testable import CertivaSDK

final class CertivaSDKTests: XCTestCase {
    @MainActor func testRealLocalOCRFromSyntheticScreenshot() async throws {
        let url = Bundle.module.url(forResource: "sms", withExtension: "png", subdirectory: "Fixtures")!
        let text = try await CertivaEngine.readImage(Data(contentsOf: url))
        XCTAssertGreaterThan(text.count, 20)
        let result = try CertivaEngine().assess(text: text, source: "apple_vision", readingConfirmed: true,
                                              now: Date(timeIntervalSince1970: 1789142400))
        XCTAssertTrue(result.reasons.contains { $0.code == "pide_datos_sensibles" })
    }
    @MainActor func testPaymentSignalsHaveNativeExplanations() throws {
        let engine = try CertivaEngine()
        for (message, code) in [
            ("Envíe 100 para recibir su beneficio.", "envio_para_recibir"),
            ("Use la nueva dirección de pago indicada por su proveedor.", "cambio_direccion")
        ] {
            let result = try engine.assess(text: message, now: Date(timeIntervalSince1970: 1789142400))
            XCTAssertEqual(result.outcome, "riesgo")
            XCTAssertTrue(result.reasons.contains { $0.code == code && !$0.title.isEmpty })
            XCTAssertNoThrow(try result.reportPayload(consent: true))
        }
    }
    @MainActor func testNativeEngineAndPrivateReport() throws {
        let engine = try CertivaEngine()
        let text = "Su cuenta será bloqueada. Envíe el código de verificación al atacante."
        let result = try engine.assess(text: text, now: Date(timeIntervalSince1970: 1789142400))
        XCTAssertEqual(result.outcome, "riesgo")
        let report = try result.reportPayload(consent: true)
        XCTAssertFalse(String(decoding: report, as: UTF8.self).contains("atacante"))
        XCTAssertThrowsError(try result.reportPayload(consent: false))
    }
    @MainActor func testOCRRequiresConfirmation() throws {
        let result = try CertivaEngine().assess(text: "Tu estado de cuenta está disponible", source: "apple_vision", now: Date(timeIntervalSince1970: 1789142400))
        XCTAssertEqual(result.outcome, "no_concluyente")
    }
    @MainActor func testExpiredPolicyAbstains() throws {
        let result = try CertivaEngine().assess(text: "Tu estado de cuenta está disponible", now: Date(timeIntervalSince1970: 1893456000))
        XCTAssertEqual(result.outcome, "no_concluyente")
    }
    @MainActor func testTamperedPolicyRejected() throws {
        let key = Curve25519.Signing.PrivateKey()
        let payload = Data("{\"schema\":1}".utf8)
        let envelope = try JSONSerialization.data(withJSONObject: ["payload": Data("{\"schema\":2}".utf8).base64EncodedString(), "signature": try key.signature(for: payload).base64EncodedString()])
        XCTAssertThrowsError(try CertivaEngine.verifyPolicy(envelope: envelope, pinnedKey: key.publicKey.rawRepresentation.base64EncodedString()))
    }
}
