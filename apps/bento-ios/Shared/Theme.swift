import SwiftUI
import UIKit
import RoutineKit

// 색은 맥 Bento 의 토큰(`--routine-*`, `--heat-*`)과 같은 값. 다크·라이트를 따로 골라 둔다.

extension UIColor {
    convenience init(hex: UInt32) {
        self.init(
            red: CGFloat((hex >> 16) & 0xFF) / 255,
            green: CGFloat((hex >> 8) & 0xFF) / 255,
            blue: CGFloat(hex & 0xFF) / 255,
            alpha: 1
        )
    }

    static func dynamic(light: UInt32, dark: UInt32) -> UIColor {
        UIColor { trait in trait.userInterfaceStyle == .dark ? UIColor(hex: dark) : UIColor(hex: light) }
    }
}

extension RoutineColor {
    var color: Color {
        switch self {
        case .blue: return Color(UIColor.dynamic(light: 0x2A78D6, dark: 0x3987E5))
        case .orange: return Color(UIColor.dynamic(light: 0xEB6834, dark: 0xD95926))
        case .aqua: return Color(UIColor.dynamic(light: 0x1BAF7A, dark: 0x199E70))
        case .yellow: return Color(UIColor.dynamic(light: 0xEDA100, dark: 0xC98500))
        case .magenta: return Color(UIColor.dynamic(light: 0xE87BA4, dark: 0xD55181))
        case .violet: return Color(UIColor.dynamic(light: 0x6250D6, dark: 0x9085E9))
        }
    }
}

enum Theme {
    /// 완료(한 색의 단계) — 히트맵·달성률
    static let ok = Color(UIColor.dynamic(light: 0x3F7D3F, dark: 0x4ADE80))
    /// 시간 — 한 색
    static let time = Color(UIColor.dynamic(light: 0x2F5D8C, dark: 0x60A5FA))
    static let warn = Color(UIColor.dynamic(light: 0xA17312, dark: 0xFBBF24))
    static let bad = Color(UIColor.dynamic(light: 0xB54848, dark: 0xF87171))

    /// 히트맵 칸. level nil = 예정 없음
    static func heat(_ level: Int?) -> Color {
        guard let level else { return Color(UIColor.tertiarySystemFill) }
        switch level {
        case 0: return Color(UIColor.secondarySystemFill)
        case 1: return ok.opacity(0.28)
        case 2: return ok.opacity(0.5)
        case 3: return ok.opacity(0.72)
        default: return ok
        }
    }

    static func level(rate: Double?, extra: Int) -> Int? {
        guard let rate else { return extra > 0 ? 1 : nil }
        if rate <= 0 { return 0 }
        if rate < 0.34 { return 1 }
        if rate < 0.67 { return 2 }
        if rate < 1 { return 3 }
        return 4
    }
}
