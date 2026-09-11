// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "CertivaSDK",
    platforms: [.iOS(.v16), .macOS(.v13)],
    products: [.library(name: "CertivaSDK", targets: ["CertivaSDK"])],
    targets: [
        .target(name: "CertivaSDK", resources: [.process("Resources")]),
        .testTarget(name: "CertivaSDKTests", dependencies: ["CertivaSDK"], resources: [.copy("Fixtures")])
    ]
)
