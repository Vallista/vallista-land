import Foundation

/// 앱·위젯이 같이 여는 JSON 파일 하나. 원자적으로 쓴다(임시 파일 → 바꿔치기).
public struct RoutineFileStore: Sendable {
    public let url: URL

    public init(url: URL) {
        self.url = url
    }

    /// App Group 폴더(없으면 앱 문서 폴더)의 `routines.json`.
    public static func shared(appGroup: String) -> RoutineFileStore {
        let fm = FileManager.default
        let base = fm.containerURL(forSecurityApplicationGroupIdentifier: appGroup)
            ?? fm.urls(for: .documentDirectory, in: .userDomainMask).first
            ?? URL(fileURLWithPath: NSTemporaryDirectory())
        return RoutineFileStore(url: base.appendingPathComponent("routines.json"))
    }

    public func load() -> RoutineDB {
        guard let data = try? Data(contentsOf: url) else { return RoutineDB() }
        if let db = try? JSONDecoder().decode(RoutineDB.self, from: data) { return db }
        // 읽지 못한 파일은 다음 저장이 덮어쓰기 전에 옆으로 옮겨 둔다.
        let aside = url.deletingPathExtension()
            .appendingPathExtension("unreadable-\(Int(Date().timeIntervalSince1970)).json")
        try? FileManager.default.moveItem(at: url, to: aside)
        return RoutineDB()
    }

    public func save(_ db: RoutineDB) throws {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.sortedKeys]
        let data = try encoder.encode(db)
        try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
        try data.write(to: url, options: [.atomic])
    }
}
