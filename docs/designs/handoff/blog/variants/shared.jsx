// Shared primitives & fake content for the three blog variants.
// Each variant imports only the ones it needs via window globals.

const SAMPLE_POSTS = [
  { title: "왜 vanilla-extract으로 옮겼는가", date: "2024.11.02", min: 9, tag: "CSS", series: "DX 재정비", cover: "grid" },
  { title: "모노레포를 다시 작게 쪼갰다", date: "2024.10.18", min: 12, tag: "Infra", series: null, cover: "stripes" },
  { title: "toss slash 라이브러리를 뜯어본 주말", date: "2024.09.18", min: 7, tag: "Library", series: null, cover: "dots" },
  { title: "React 19의 Server Components 적응기", date: "2024.08.20", min: 11, tag: "React", series: "React 19", cover: "blocks" },
  { title: "Sprinkles로 반응형 스타일링을 정리하다", date: "2024.08.03", min: 6, tag: "CSS", series: "DX 재정비", cover: "lines" },
  { title: "Storybook 9 에서 docs가 다시 좋아졌다", date: "2024.07.12", min: 5, tag: "Tooling", series: null, cover: "grid" },
];

const NOTES = [
  { date: "10.22", text: "오늘 읽은 것 — React Compiler가 실제로 하는 일에 대한 짧은 메모." },
  { date: "10.14", text: "Headless UI 패턴이 결국 스타일 문제로 돌아오는 이유." },
  { date: "10.02", text: "Popover의 접근성은 디테일에서 무너진다. Radix가 맞다." },
];

const NAV = [
  { k: "home", label: "Home", count: null },
  { k: "articles", label: "Articles", count: 42 },
  { k: "notes", label: "Notes", count: 28 },
  { k: "projects", label: "Projects", count: 6 },
  { k: "tags", label: "Tags", count: null },
  { k: "about", label: "About", count: null },
];

const SERIES = [
  { k: "dx", label: "DX 재정비", count: 4 },
  { k: "react19", label: "React 19", count: 3 },
  { k: "ds", label: "Design System", count: 6 },
];

const TAGS = ["react", "typescript", "css", "monorepo", "rsc", "storybook", "vanilla-extract", "tooling"];

// Cover placeholder — patterned so "every post has a cover" looks feasible
// without real imagery. Each pattern uses the blue accent softly.
const Cover = ({ kind = "grid", ratio = "16/9", blue = "var(--blue)" }) => {
  const common = { aspectRatio: ratio, width: "100%", background: "var(--blue-50)", position: "relative", overflow: "hidden" };
  const patterns = {
    grid: (
      <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 400 225">
        <defs>
          <pattern id="gr" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M0 0h24v24H0z" fill="none" stroke={blue} strokeOpacity="0.22" strokeWidth="0.6"/>
          </pattern>
        </defs>
        <rect width="400" height="225" fill="url(#gr)"/>
        <circle cx="320" cy="60" r="44" fill={blue} fillOpacity="0.14"/>
        <rect x="40" y="130" width="110" height="40" rx="4" fill={blue} fillOpacity="0.18"/>
      </svg>
    ),
    stripes: (
      <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 400 225">
        <defs>
          <pattern id="st" width="14" height="14" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <rect width="7" height="14" fill={blue} fillOpacity="0.10"/>
          </pattern>
        </defs>
        <rect width="400" height="225" fill="url(#st)"/>
      </svg>
    ),
    dots: (
      <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 400 225">
        <defs>
          <pattern id="dt" width="18" height="18" patternUnits="userSpaceOnUse">
            <circle cx="9" cy="9" r="1.6" fill={blue} fillOpacity="0.26"/>
          </pattern>
        </defs>
        <rect width="400" height="225" fill="url(#dt)"/>
      </svg>
    ),
    blocks: (
      <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 400 225">
        <rect x="30" y="30" width="120" height="70" fill={blue} fillOpacity="0.22"/>
        <rect x="160" y="30" width="70" height="70" fill={blue} fillOpacity="0.12"/>
        <rect x="240" y="30" width="130" height="165" fill={blue} fillOpacity="0.08"/>
        <rect x="30" y="110" width="200" height="85" fill={blue} fillOpacity="0.16"/>
      </svg>
    ),
    lines: (
      <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 400 225">
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={i} x1="0" y1={25 * (i + 1)} x2="400" y2={25 * (i + 1) - 40} stroke={blue} strokeOpacity={0.15 + i * 0.02} strokeWidth="1"/>
        ))}
      </svg>
    ),
  };
  return <div style={common}>{patterns[kind] || patterns.grid}</div>;
};

// Tiny square brand mark used in sidebars/headers.
const Mark = ({ size = 20 }) => (
  <div style={{ width: size, height: size, borderRadius: 5, background: "var(--ink)", position: "relative", flexShrink: 0 }}>
    <div style={{ position: "absolute", inset: size * 0.22, borderRadius: 2, background: "var(--blue)" }} />
  </div>
);

const Chip = ({ children, tone = "default" }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "3px 8px", borderRadius: 999,
    background: tone === "blue" ? "var(--blue-50)" : "var(--line-2)",
    color: tone === "blue" ? "var(--blue-600)" : "var(--ink-3)",
    fontSize: 11, fontWeight: 500, letterSpacing: 0.02,
  }}>{children}</span>
);

// Mobile device bezel — bezel-less minimal.
const Phone = ({ children, bg = "#fff" }) => (
  <div style={{ width: "100%", height: "100%", background: bg, position: "relative", overflow: "hidden", fontSize: 14 }}>
    {/* status bar */}
    <div style={{ height: 44, padding: "14px 22px 0", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
      <span>9:41</span>
      <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
        <svg width="16" height="10" viewBox="0 0 16 10" fill="currentColor"><rect x="0" y="6" width="3" height="4" rx="0.5"/><rect x="4" y="4" width="3" height="6" rx="0.5"/><rect x="8" y="2" width="3" height="8" rx="0.5"/><rect x="12" y="0" width="3" height="10" rx="0.5"/></svg>
        <svg width="24" height="10" viewBox="0 0 24 10" fill="none" stroke="currentColor" strokeWidth="1"><rect x="0.5" y="0.5" width="20" height="9" rx="2"/><rect x="2" y="2" width="16" height="6" rx="1" fill="currentColor"/><rect x="21" y="3" width="2" height="4" rx="0.5" fill="currentColor"/></svg>
      </span>
    </div>
    {children}
  </div>
);

Object.assign(window, { SAMPLE_POSTS, NOTES, NAV, SERIES, TAGS, Cover, Mark, Chip, Phone });
