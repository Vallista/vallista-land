import Foundation

/// `YYYY-MM-DD` 로컬 날짜 키. 계산은 정오 기준이라 서머타임 경계에서 하루 밀리지 않는다.
public enum DayKey {
    public static func calendar(_ timeZone: TimeZone = .current) -> Calendar {
        var c = Calendar(identifier: .gregorian)
        c.timeZone = timeZone
        return c
    }

    public static func key(_ date: Date, timeZone: TimeZone = .current) -> String {
        let parts = calendar(timeZone).dateComponents([.year, .month, .day], from: date)
        return String(format: "%04d-%02d-%02d", parts.year ?? 1970, parts.month ?? 1, parts.day ?? 1)
    }

    static func parts(_ key: String) -> (Int, Int, Int)? {
        let bits = key.split(separator: "-")
        guard bits.count == 3, bits[0].count == 4, bits[1].count == 2, bits[2].count == 2,
              let y = Int(bits[0]), let m = Int(bits[1]), let d = Int(bits[2]) else { return nil }
        return (y, m, d)
    }

    /// 그날 로컬 정오.
    public static func date(_ key: String, timeZone: TimeZone = .current) -> Date? {
        guard let (y, m, d) = parts(key) else { return nil }
        var comps = DateComponents()
        comps.year = y
        comps.month = m
        comps.day = d
        comps.hour = 12
        let cal = calendar(timeZone)
        guard let noon = cal.date(from: comps) else { return nil }
        // 2월 30일 같은 날은 3월 2일로 넘어가 버린다 — 되돌려 맞춰 보고 다르면 없는 날.
        return Self.key(noon, timeZone: timeZone) == key ? noon : nil
    }

    public static func isValid(_ key: String) -> Bool { date(key, timeZone: TimeZone(identifier: "UTC") ?? .current) != nil }

    public static func add(_ key: String, _ days: Int) -> String {
        let tz = TimeZone(identifier: "UTC") ?? .current
        guard let d = date(key, timeZone: tz),
              let moved = calendar(tz).date(byAdding: .day, value: days, to: d) else { return key }
        return Self.key(moved, timeZone: tz)
    }

    /// 0=일 … 6=토
    public static func weekday(_ key: String) -> Int {
        let tz = TimeZone(identifier: "UTC") ?? .current
        guard let d = date(key, timeZone: tz) else { return 0 }
        return calendar(tz).component(.weekday, from: d) - 1
    }

    /// b - a (일)
    public static func between(_ a: String, _ b: String) -> Int {
        let tz = TimeZone(identifier: "UTC") ?? .current
        guard let da = date(a, timeZone: tz), let db = date(b, timeZone: tz) else { return 0 }
        return calendar(tz).dateComponents([.day], from: da, to: db).day ?? 0
    }

    /// from…to 양 끝 포함. from > to 면 빈 배열.
    public static func range(_ from: String, _ to: String) -> [String] {
        let n = between(from, to)
        guard n >= 0 else { return [] }
        var out: [String] = []
        out.reserveCapacity(n + 1)
        var k = from
        for _ in 0...n {
            out.append(k)
            k = add(k, 1)
        }
        return out
    }

    public static func weekStart(_ key: String, mondayFirst: Bool) -> String {
        let dow = weekday(key)
        let back = mondayFirst ? (dow + 6) % 7 : dow
        return add(key, -back)
    }

    public static func monthStart(_ key: String) -> String { "\(key.prefix(7))-01" }

    public static func monthEnd(_ key: String) -> String {
        guard let (y, m, _) = parts(key) else { return key }
        let ny = m == 12 ? y + 1 : y
        let nm = m == 12 ? 1 : m + 1
        return add(String(format: "%04d-%02d-01", ny, nm), -1)
    }

    /// "10월 25일 (일)"
    public static func label(_ key: String) -> String {
        guard let (_, m, d) = parts(key) else { return key }
        let dows = ["일", "월", "화", "수", "목", "금", "토"]
        return "\(m)월 \(d)일 (\(dows[weekday(key)]))"
    }
}

/// RFC 3339 시각. 서버는 밀리초를 붙여 돌려주고, 맥은 초까지만 보낸다 — 둘 다 읽는다.
public enum Clock {
    public static func iso(_ date: Date) -> String {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f.string(from: date)
    }

    public static func parse(_ s: String) -> Date? {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let d = f.date(from: s) { return d }
        f.formatOptions = [.withInternetDateTime]
        return f.date(from: s)
    }

    /// a 가 b 보다 나중인가. 못 읽는 시각은 가장 이른 것으로 본다.
    public static func isAfter(_ a: String, _ b: String) -> Bool {
        (parse(a) ?? .distantPast) > (parse(b) ?? .distantPast)
    }

    /// 처음 연결 때 로컬 전부에 붙이는 시각 — 서버에 같은 것이 있으면 서버가 이긴다.
    public static let epoch = "2000-01-01T00:00:00.000Z"
}
