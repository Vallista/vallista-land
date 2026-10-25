// swift-tools-version:5.9
import PackageDescription

// 루틴 앱의 화면 밖 전부 — 모델 · 규칙 · 통계 · 동기화 · 저장.
// Foundation 만 쓰므로 맥에서 `swift test` 로 돌린다 (CI: .github/workflows/bento-ios.yml).
let package = Package(
    name: "RoutineKit",
    platforms: [.iOS(.v17), .macOS(.v14)],
    products: [
        .library(name: "RoutineKit", targets: ["RoutineKit"]),
    ],
    targets: [
        .target(name: "RoutineKit"),
        .testTarget(name: "RoutineKitTests", dependencies: ["RoutineKit"]),
    ]
)
