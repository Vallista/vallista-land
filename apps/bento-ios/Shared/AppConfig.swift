import Foundation
import RoutineKit

/// 앱과 위젯이 같이 쓰는 자리.
/// App Group 이름은 project.yml 의 `BENTO_APP_GROUP` 하나에서 정한다 — entitlements 와 Info.plist(`BentoAppGroup`)에 같이 들어간다.
enum AppConfig {
    static let appGroup: String = {
        let v = Bundle.main.object(forInfoDictionaryKey: "BentoAppGroup") as? String ?? ""
        return v.isEmpty || v.hasPrefix("$(") ? "group.com.vallista.bento" : v
    }()
    static let defaultServer = "https://nyanotion.party"

    static var store: RoutineFileStore { RoutineFileStore.shared(appGroup: appGroup) }

    static var defaults: UserDefaults { UserDefaults(suiteName: appGroup) ?? .standard }

    static var mondayFirst: Bool {
        get { defaults.object(forKey: "mondayFirst") as? Bool ?? true }
        set { defaults.set(newValue, forKey: "mondayFirst") }
    }

    static var serverURL: String {
        get { defaults.string(forKey: "serverURL") ?? defaultServer }
        set { defaults.set(newValue, forKey: "serverURL") }
    }

    static var syncEnabled: Bool {
        get { defaults.bool(forKey: "syncEnabled") }
        set { defaults.set(newValue, forKey: "syncEnabled") }
    }

    static func today(_ now: Date = Date()) -> String { DayKey.key(now) }
}

extension Notification.Name {
    /// 다른 프로세스(위젯·잠금화면 단추)가 저장 파일을 고쳤다.
    static let routineStoreChanged = Notification.Name("bento.routineStoreChanged")
}
