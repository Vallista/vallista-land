// Paper Light (Variant A) — extended screens
// Notes · Projects · Tag · About · Search · Dark mode · 404
// Consumes primitives from shared.jsx via window.

const { SAMPLE_POSTS: PA_Posts, NOTES: PA_Notes, NAV: PA_Nav, SERIES: PA_Series, TAGS: PA_Tags, Cover: PA_Cover, Mark: PA_Mark, Chip: PA_Chip, Phone: PA_Phone } = window;

// ─── Sidebar (reused, with active prop) ────────────────────
const PASidebar = ({ active = "home" }) => (
  <aside style={{ width: 220, padding: "40px 28px", borderRight: "1px solid var(--line-2)", background: "var(--bg)", display: "flex", flexDirection: "column", gap: 36, height: "100%", boxSizing: "border-box" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <PA_Mark size={22} />
      <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.1, color: "var(--ink)" }}>vallista-land</div>
    </div>
    <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {PA_Nav.map(n => (
        <a key={n.k} style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "8px 10px", borderRadius: 6, textDecoration: "none",
          color: active === n.k ? "var(--ink)" : "var(--ink-3)",
          background: active === n.k ? "var(--bg-soft)" : "transparent",
          fontSize: 14, fontWeight: active === n.k ? 600 : 500,
        }}>
          <span>{n.label}</span>
          {n.count != null && <span style={{ fontSize: 11, color: "var(--ink-4)", fontFamily: "var(--mono)" }}>{n.count}</span>}
        </a>
      ))}
    </nav>
    <div>
      <div style={{ fontSize: 11, fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: 0.14, color: "var(--ink-4)", marginBottom: 10, padding: "0 10px" }}>Series</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {PA_Series.map(s => (
          <a key={s.k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", fontSize: 13, color: "var(--ink-2)", textDecoration: "none" }}>
            <span>{s.label}</span>
            <span style={{ fontSize: 11, color: "var(--ink-4)", fontFamily: "var(--mono)" }}>{s.count}</span>
          </a>
        ))}
      </div>
    </div>
    <div style={{ marginTop: "auto", paddingTop: 20, borderTop: "1px solid var(--line-2)", fontSize: 11, color: "var(--ink-4)", fontFamily: "var(--mono)" }}>
      RSS · GitHub · Email
    </div>
  </aside>
);

const PAPageHead = ({ eyebrow, title, subtitle, right = null }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 36 }}>
    <div>
      <div style={{ fontSize: 11, fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: 0.16, color: "var(--ink-4)", marginBottom: 8 }}>{eyebrow}</div>
      <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700, letterSpacing: -0.5, color: "var(--ink)" }}>{title}</h1>
      {subtitle && <div style={{ marginTop: 8, fontSize: 14, color: "var(--ink-3)", maxWidth: 480, lineHeight: 1.55 }}>{subtitle}</div>}
    </div>
    {right}
  </div>
);

// ─── Notes page ─────────────────────────────────────────────
const PA_NotesFull = [
  ...PA_Notes,
  { date: "09.24", text: "TanStack Router v1의 타입 추론이 드디어 읽기 좋아졌다. 실수할 여지가 눈에 띄게 줄었다." },
  { date: "09.11", text: "CSS anchor positioning — 메뉴 위치 잡는 JS 코드를 걷어낼 때가 됐다." },
  { date: "08.28", text: "모노레포에서 Changesets 없이 버전 관리하려다 이틀 날렸다. 그냥 쓰자." },
  { date: "08.15", text: "Arc → Zen → 다시 Arc. 결국 탭 컨테이너가 없으면 못 산다." },
];

const PaperNotes = () => (
  <div style={{ display: "flex", height: "100%", background: "var(--bg)", fontSize: 14 }}>
    <PASidebar active="notes" />
    <main style={{ flex: 1, padding: "48px 64px 64px", overflow: "hidden" }}>
      <PAPageHead
        eyebrow="@vallista · notes"
        title="짧은 메모"
        subtitle="기록할 가치는 있지만 글 한 편은 아닌 것들. 날짜순 내림차순."
        right={<div style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--ink-4)" }}>{PA_NotesFull.length} NOTES · 2024</div>}
      />

      {/* timeline-style list */}
      <div style={{ position: "relative", paddingLeft: 24, borderLeft: "1px solid var(--line-2)" }}>
        {PA_NotesFull.map((n, i) => (
          <div key={i} style={{ position: "relative", padding: "14px 0 26px", borderBottom: i < PA_NotesFull.length - 1 ? "1px solid var(--line-2)" : "none" }}>
            <div style={{ position: "absolute", left: -28, top: 20, width: 7, height: 7, borderRadius: "50%", background: i === 0 ? "var(--blue)" : "var(--line)" }} />
            <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-4)", letterSpacing: 0.1, width: 52, flexShrink: 0, paddingTop: 2 }}>10.{n.date.split(".")[1] || n.date.split(".")[0]}</div>
              <div style={{ fontSize: 15.5, lineHeight: 1.7, color: "var(--ink)" }}>{n.text}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 40, display: "flex", gap: 10, justifyContent: "center" }}>
        <button style={{ padding: "10px 20px", border: "1px solid var(--line)", background: "var(--bg)", borderRadius: 8, fontSize: 13, color: "var(--ink-2)", cursor: "pointer", fontFamily: "inherit" }}>더 보기 <span style={{ color: "var(--ink-4)", marginLeft: 4 }}>21 →</span></button>
      </div>
    </main>
  </div>
);

// ─── Projects page ──────────────────────────────────────────
const PA_Projects = [
  { title: "nest", tag: "CLI · 2024", desc: "프로젝트 시작을 30초로 줄이는 로컬 scaffolder. 사내 모노레포 기본 뼈대를 그대로 찍어낸다.", stars: "312", status: "active", cover: "blocks" },
  { title: "pretendard-utils", tag: "Library · 2024", desc: "한국어 타이포그래피 유틸. 행간·자간·한영 혼용 시 자동 보정을 다룬다.", stars: "1.2k", status: "active", cover: "stripes" },
  { title: "csscope", tag: "Devtool · 2023", desc: "Chrome devtools 확장. 스타일 계산 경로와 shadow boundary를 시각화한다.", stars: "842", status: "maintenance", cover: "grid" },
  { title: "ephemera", tag: "Blog engine · 2023", desc: "이 블로그의 엔진. Astro 기반, 글 하나당 한 파일, 빌드 때만 조립한다.", stars: "44", status: "active", cover: "lines" },
  { title: "mono-checker", tag: "CI · 2022", desc: "PR의 Changeset 누락을 잡는 GitHub Action. 단순하지만 가장 자주 쓴다.", stars: "89", status: "maintenance", cover: "dots" },
  { title: "pulse", tag: "Experiment · 2022", desc: "오디오 시각화 실험. WebAudio + Canvas. 지금은 구경만 가능한 상태.", stars: "12", status: "archived", cover: "blocks" },
];

const PaperProjects = () => (
  <div style={{ display: "flex", height: "100%", background: "var(--bg)", fontSize: 14 }}>
    <PASidebar active="projects" />
    <main style={{ flex: 1, padding: "48px 64px 64px", overflow: "hidden" }}>
      <PAPageHead
        eyebrow="@vallista · projects"
        title="만들어 둔 것들"
        subtitle="실제로 쓰는 것들만. 실험은 GitHub에만 두고 여기엔 올리지 않는다."
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "24px 28px" }}>
        {PA_Projects.map(p => (
          <a key={p.title} style={{ display: "flex", flexDirection: "column", gap: 14, padding: 20, border: "1px solid var(--line-2)", borderRadius: 12, textDecoration: "none", color: "inherit", background: "var(--bg)" }}>
            <div style={{ aspectRatio: "16/7", borderRadius: 6, overflow: "hidden" }}><PA_Cover kind={p.cover} ratio="16/7" /></div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--ink-4)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.1 }}>{p.tag}</div>
                <h3 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: -0.3 }}>{p.title}</h3>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-3)" }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M6 1l1.5 3 3.3.5-2.4 2.3.6 3.3L6 8.6l-3 1.5.6-3.3L1.2 4.5l3.3-.5z"/></svg>
                {p.stars}
              </div>
            </div>
            <p style={{ margin: 0, fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.6 }}>{p.desc}</p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "3px 8px", borderRadius: 999,
                background: p.status === "active" ? "#e8f6ee" : p.status === "maintenance" ? "var(--line-2)" : "#f7f0e8",
                color: p.status === "active" ? "#2a7f3f" : p.status === "maintenance" ? "var(--ink-3)" : "#8a6628",
                fontSize: 11, fontWeight: 500,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor" }} />
                {p.status}
              </span>
              <span style={{ fontSize: 12, color: "var(--blue)", fontFamily: "var(--mono)" }}>GitHub →</span>
            </div>
          </a>
        ))}
      </div>
    </main>
  </div>
);

// ─── Tag detail page (#react) ───────────────────────────────
const PaperTag = () => {
  const posts = [
    ...PA_Posts.filter(p => p.tag === "React"),
    { title: "Suspense를 실제 앱에 끼워넣는 법", date: "2024.06.14", min: 8, tag: "React", series: "React 19", cover: "dots" },
    { title: "useOptimistic이 바꾼 폼 UX", date: "2024.05.22", min: 5, tag: "React", series: "React 19", cover: "stripes" },
    { title: "렌더링 없는 훅의 쓸모", date: "2024.04.03", min: 4, tag: "React", series: null, cover: "lines" },
  ];
  return (
    <div style={{ display: "flex", height: "100%", background: "var(--bg)", fontSize: 14 }}>
      <PASidebar active="tags" />
      <main style={{ flex: 1, padding: "48px 64px 64px", overflow: "hidden" }}>
        <div style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--ink-4)", marginBottom: 10, letterSpacing: 0.1 }}>
          @vallista <span style={{ color: "var(--line)", margin: "0 6px" }}>/</span> tags <span style={{ color: "var(--line)", margin: "0 6px" }}>/</span> <span style={{ color: "var(--ink-2)" }}>react</span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 8 }}>
          <h1 style={{ margin: 0, fontSize: 44, fontWeight: 700, letterSpacing: -0.8 }}>#<span style={{ color: "var(--blue)" }}>react</span></h1>
          <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-3)" }}>{posts.length}개 글</div>
        </div>
        <p style={{ margin: "0 0 32px", fontSize: 15, color: "var(--ink-3)", maxWidth: 560, lineHeight: 1.6 }}>
          React 관련 글 모음. 서버 컴포넌트 이후로 다시 흥미로워졌다.
        </p>

        {/* related tags as chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingBottom: 28, borderBottom: "1px solid var(--line-2)", marginBottom: 32 }}>
          <span style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--ink-4)", letterSpacing: 0.12, textTransform: "uppercase", paddingRight: 6, alignSelf: "center" }}>Related</span>
          {PA_Tags.filter(t => t !== "react").slice(0, 6).map(t => (
            <span key={t} style={{
              display: "inline-flex", gap: 5, padding: "4px 10px", border: "1px solid var(--line-2)", borderRadius: 999,
              fontSize: 12, color: "var(--ink-2)", background: "var(--bg)",
            }}>#{t}</span>
          ))}
        </div>

        {/* list style */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {posts.map((p, i) => (
            <a key={i} style={{ display: "grid", gridTemplateColumns: "120px 1fr 110px", gap: 24, alignItems: "center", padding: "22px 0", borderTop: i === 0 ? "1px solid var(--line-2)" : "none", borderBottom: "1px solid var(--line-2)", textDecoration: "none", color: "inherit" }}>
              <div style={{ fontSize: 12, fontFamily: "var(--mono)", color: "var(--ink-4)", letterSpacing: 0.08 }}>{p.date}</div>
              <div>
                <h3 style={{ margin: 0, fontSize: 19, fontWeight: 600, letterSpacing: -0.3, lineHeight: 1.3 }}>{p.title}</h3>
                {p.series && <div style={{ marginTop: 6, fontSize: 12, color: "var(--blue-600)", fontFamily: "var(--mono)" }}>in {p.series}</div>}
              </div>
              <div style={{ fontSize: 12, fontFamily: "var(--mono)", color: "var(--ink-4)", textAlign: "right" }}>{p.min} min read</div>
            </a>
          ))}
        </div>
      </main>
    </div>
  );
};

// ─── About page ─────────────────────────────────────────────
const PaperAbout = () => (
  <div style={{ display: "flex", height: "100%", background: "var(--bg)", fontSize: 14 }}>
    <PASidebar active="about" />
    <main style={{ flex: 1, padding: "56px 64px 80px", overflow: "hidden" }}>
      <div style={{ maxWidth: 680 }}>
        <div style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--ink-4)", marginBottom: 10, letterSpacing: 0.1, textTransform: "uppercase" }}>About</div>
        <h1 style={{ margin: "0 0 24px", fontSize: 48, fontWeight: 700, letterSpacing: -1, lineHeight: 1.1 }}>
          프론트엔드 엔지니어.<br/><span style={{ color: "var(--blue)" }}>여기서 생각을 정리</span>합니다.
        </h1>

        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 36, paddingBottom: 28, borderBottom: "1px solid var(--line-2)" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, var(--blue-50), var(--blue))", flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 17, fontWeight: 600 }}>vallista</div>
            <div style={{ fontSize: 13.5, color: "var(--ink-3)", marginTop: 3 }}>서울 · 8년 차 · 지금은 우아한형제들 배민 선물하기팀</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <a style={{ padding: "8px 14px", border: "1px solid var(--line)", borderRadius: 8, fontSize: 13, color: "var(--ink-2)", textDecoration: "none" }}>GitHub</a>
            <a style={{ padding: "8px 14px", background: "var(--ink)", color: "#fff", borderRadius: 8, fontSize: 13, textDecoration: "none", fontWeight: 500 }}>Email ↗</a>
          </div>
        </div>

        <div style={{ fontSize: 16.5, lineHeight: 1.85, color: "var(--ink)" }}>
          <p style={{ margin: "0 0 22px" }}>
            주로 <a style={{ color: "var(--blue)", textDecoration: "none", borderBottom: "1px solid var(--blue)" }}>디자인 시스템</a>·프론트엔드 아키텍처·개인 도구에 관심이 있습니다. 최근에는 모노레포의 DX 재정비, 제로런타임 CSS, 서버 컴포넌트를 실제 앱에 끼워넣는 작업을 했습니다.
          </p>
          <p style={{ margin: "0 0 22px" }}>
            이 블로그는 기록하려고 씁니다. 읽히기 위해서가 아니라 스스로 한 번 더 검토하려고요. 그래서 글은 길고, 서두가 느리고, 결론보다는 과정이 많습니다.
          </p>
        </div>

        <div style={{ marginTop: 40, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div>
            <div style={{ fontSize: 11, fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: 0.14, color: "var(--ink-4)", marginBottom: 14 }}>지금 쓰는 것</div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", fontSize: 14, color: "var(--ink-2)", lineHeight: 2 }}>
              <li>· Astro + Pretendard · 이 블로그</li>
              <li>· TypeScript strict · 항상</li>
              <li>· vanilla-extract + Sprinkles</li>
              <li>· Linear · Arc · Raycast</li>
            </ul>
          </div>
          <div>
            <div style={{ fontSize: 11, fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: 0.14, color: "var(--ink-4)", marginBottom: 14 }}>최근 이력</div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", fontSize: 14, color: "var(--ink-2)", lineHeight: 2 }}>
              <li>· 2022— 우아한형제들</li>
              <li>· 2020–2022 스타트업 2곳</li>
              <li>· 2016–2020 SI · 프리랜서</li>
            </ul>
          </div>
        </div>

        <div style={{ marginTop: 48, padding: "20px 24px", background: "var(--bg-soft)", border: "1px solid var(--line-2)", borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>새 글 알림 받기</div>
            <div style={{ fontSize: 13, color: "var(--ink-3)" }}>월 1–2회, 스팸 없음. RSS도 있습니다.</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <input placeholder="you@domain" style={{ padding: "10px 14px", border: "1px solid var(--line)", borderRadius: 8, fontSize: 13, fontFamily: "inherit", width: 200, background: "var(--bg)" }} />
            <button style={{ padding: "10px 18px", background: "var(--blue)", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>구독</button>
          </div>
        </div>
      </div>
    </main>
  </div>
);

// ─── Search (⌘K palette over Home) ──────────────────────────
const PaperSearch = () => (
  <div style={{ position: "relative", display: "flex", height: "100%", background: "var(--bg)", fontSize: 14 }}>
    <PASidebar active="home" />
    <main style={{ flex: 1, padding: "48px 64px 64px", overflow: "hidden", opacity: 0.35, pointerEvents: "none" }}>
      <PAPageHead eyebrow="@vallista · 글" title="최근에 쓴 글" />
      <div style={{ height: 300, background: "var(--bg-soft)", borderRadius: 10 }} />
    </main>

    {/* scrim */}
    <div style={{ position: "absolute", inset: 0, background: "rgba(11, 18, 32, 0.35)", backdropFilter: "blur(2px)" }} />

    {/* palette */}
    <div style={{ position: "absolute", top: 96, left: "50%", transform: "translateX(-50%)", width: 560, background: "var(--bg)", borderRadius: 14, boxShadow: "0 24px 60px rgba(11,18,32,0.2), 0 2px 6px rgba(11,18,32,0.06)", overflow: "hidden", border: "1px solid var(--line-2)" }}>
      <div style={{ position: "relative", borderBottom: "1px solid var(--line-2)" }}>
        <svg style={{ position: "absolute", top: 19, left: 20 }} width="16" height="16" viewBox="0 0 14 14" fill="none" stroke="var(--ink-4)" strokeWidth="1.4"><circle cx="6" cy="6" r="4.5"/><path d="M9.5 9.5L13 13"/></svg>
        <input value="vanilla" readOnly style={{ width: "100%", padding: "18px 20px 18px 48px", border: "none", fontSize: 16, fontFamily: "inherit", color: "var(--ink)", background: "transparent", outline: "none", boxSizing: "border-box" }} />
        <span style={{ position: "absolute", top: 17, right: 16, fontFamily: "var(--mono)", fontSize: 11, padding: "3px 7px", border: "1px solid var(--line)", borderRadius: 4, color: "var(--ink-4)" }}>esc</span>
      </div>
      <div style={{ maxHeight: 380, overflow: "hidden" }}>
        <div style={{ padding: "10px 16px 6px", fontSize: 10, fontFamily: "var(--mono)", letterSpacing: 0.18, textTransform: "uppercase", color: "var(--ink-4)" }}>Articles · 3</div>
        {[
          { title: "왜 vanilla-extract으로 옮겼는가", meta: "2024.11 · DX 재정비", hi: [2,16] },
          { title: "Sprinkles로 반응형 스타일링을 정리하다", meta: "2024.08 · DX 재정비" },
          { title: "3년 차의 실수 — vanilla JS 시절", meta: "2021.04" },
        ].map((r, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 14, padding: "12px 18px",
            background: i === 0 ? "var(--blue-50)" : "transparent",
            borderLeft: i === 0 ? "2px solid var(--blue)" : "2px solid transparent",
          }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: "var(--line-2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-3)", fontSize: 12, flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M3 1.5h5.5L11 4v8.5H3z"/><path d="M8.5 1.5V4H11"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: "var(--ink)", fontWeight: i === 0 ? 600 : 500 }}>
                {r.hi ? <>왜 <mark style={{ background: "transparent", color: "var(--blue-600)", fontWeight: 700 }}>vanilla</mark>-extract으로 옮겼는가</> : r.title}
              </div>
              <div style={{ fontSize: 11.5, color: "var(--ink-4)", marginTop: 2, fontFamily: "var(--mono)" }}>{r.meta}</div>
            </div>
            {i === 0 && <span style={{ fontFamily: "var(--mono)", fontSize: 10, padding: "2px 6px", border: "1px solid var(--line)", borderRadius: 4, color: "var(--ink-4)" }}>↵</span>}
          </div>
        ))}

        <div style={{ padding: "10px 16px 6px", fontSize: 10, fontFamily: "var(--mono)", letterSpacing: 0.18, textTransform: "uppercase", color: "var(--ink-4)", marginTop: 6 }}>Tags · 2</div>
        {[{ k: "vanilla-extract", c: 4 }, { k: "vanilla-js", c: 2 }].map(t => (
          <div key={t.k} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 18px" }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: "var(--line-2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-3)", fontSize: 12, flexShrink: 0 }}>#</div>
            <div style={{ flex: 1, fontSize: 13.5, color: "var(--ink-2)" }}>#{t.k}</div>
            <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-4)" }}>{t.c}개 글</span>
          </div>
        ))}
      </div>
      <div style={{ borderTop: "1px solid var(--line-2)", padding: "10px 18px", display: "flex", gap: 18, fontSize: 11, fontFamily: "var(--mono)", color: "var(--ink-4)" }}>
        <span>↑↓ navigate</span>
        <span>↵ open</span>
        <span style={{ marginLeft: "auto" }}>Search by <span style={{ color: "var(--blue-600)" }}>Pagefind</span></span>
      </div>
    </div>
  </div>
);

// ─── Dark mode (Article) ────────────────────────────────────
const PaperDark = () => (
  <div style={{ display: "flex", height: "100%", background: "#0b1220", color: "#dbe2ff", fontSize: 14 }}>
    <aside style={{ width: 220, padding: "40px 28px", borderRight: "1px solid #1c2540", background: "#0b1220", display: "flex", flexDirection: "column", gap: 36, height: "100%", boxSizing: "border-box" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 22, height: 22, borderRadius: 5, background: "#fff", position: "relative" }}>
          <div style={{ position: "absolute", inset: 5, borderRadius: 2, background: "var(--blue)" }} />
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>vallista-land</div>
      </div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {PA_Nav.map(n => (
          <a key={n.k} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "8px 10px", borderRadius: 6, textDecoration: "none",
            color: n.k === "articles" ? "#fff" : "#9aa1b4",
            background: n.k === "articles" ? "#131c33" : "transparent",
            fontSize: 14, fontWeight: n.k === "articles" ? 600 : 500,
          }}>
            <span>{n.label}</span>
            {n.count != null && <span style={{ fontSize: 11, color: "#6b7389", fontFamily: "var(--mono)" }}>{n.count}</span>}
          </a>
        ))}
      </nav>
      <div>
        <div style={{ fontSize: 11, fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: 0.14, color: "#6b7389", marginBottom: 10, padding: "0 10px" }}>Series</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {PA_Series.map(s => (
            <a key={s.k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", fontSize: 13, color: "#9aa1b4", textDecoration: "none" }}>
              <span>{s.label}</span>
              <span style={{ fontSize: 11, color: "#6b7389", fontFamily: "var(--mono)" }}>{s.count}</span>
            </a>
          ))}
        </div>
      </div>
      <div style={{ marginTop: "auto", paddingTop: 20, borderTop: "1px solid #1c2540", fontSize: 11, color: "#6b7389", fontFamily: "var(--mono)", display: "flex", justifyContent: "space-between" }}>
        <span>RSS · GH</span>
        <span>◐ Dark</span>
      </div>
    </aside>

    <main style={{ flex: 1, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "#1c2540" }}>
        <div style={{ width: "42%", height: "100%", background: "var(--blue)" }} />
      </div>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "72px 40px 120px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <span style={{ padding: "3px 8px", borderRadius: 999, background: "rgba(43,108,255,0.18)", color: "#8ab4ff", fontSize: 11, fontWeight: 500 }}>DX 재정비 · 1/4</span>
          <span style={{ padding: "3px 8px", borderRadius: 999, background: "#131c33", color: "#9aa1b4", fontSize: 11 }}>CSS</span>
        </div>
        <h1 style={{ margin: "0 0 14px", fontSize: 44, fontWeight: 700, letterSpacing: -0.8, lineHeight: 1.15, color: "#fff" }}>왜 vanilla-extract으로 옮겼는가</h1>
        <p style={{ margin: "0 0 28px", fontSize: 18, color: "#9aa1b4", lineHeight: 1.55 }}>
          런타임 비용을 지불하지 않으면서, 타입 안전한 스타일을 유지하는 가장 간단한 방법에 대한 기록.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 13, color: "#6b7389", fontFamily: "var(--mono)", paddingBottom: 32, borderBottom: "1px solid #1c2540" }}>
          <span>2024.11.02</span><span>·</span><span>9 min read</span><span>·</span><span>3,201 words</span>
        </div>

        <div style={{ fontSize: 17, lineHeight: 1.85, color: "#dbe2ff", marginTop: 36 }}>
          <p style={{ margin: "0 0 22px" }}>처음에는 <a style={{ color: "#8ab4ff", textDecoration: "none", borderBottom: "1px solid #8ab4ff" }}>Emotion</a>으로 시작했다. 컴포넌트 옆에 스타일을 바로 쓸 수 있고, prop 기반 분기도 자연스러웠다. 그러다 앱이 커지고 모노레포에 패키지가 늘자, 번들의 스타일 런타임이 무거워지기 시작했다.</p>
          <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.3, margin: "44px 0 14px", color: "#fff" }}>문제는 번들이 아니라 타이밍이었다</h2>
          <p style={{ margin: "0 0 22px" }}>실제 크기가 크진 않았다. 문제는 첫 paint 전에 JS가 파싱·실행돼야만 스타일이 붙는다는 점이었다.</p>

          <div style={{ margin: "28px 0", padding: "18px 22px", background: "rgba(43,108,255,0.08)", borderLeft: "3px solid var(--blue)", borderRadius: "2px 6px 6px 2px", color: "#dbe2ff", fontSize: 15.5, lineHeight: 1.7 }}>
            <strong style={{ color: "#8ab4ff" }}>NOTE </strong>
            TTI 300ms 개선이 목표였고, 실제로는 CLS 쪽에서 더 큰 이득을 봤다.
          </div>

          <div style={{ margin: "28px 0", borderRadius: 10, overflow: "hidden", border: "1px solid #1c2540", background: "#080d19" }}>
            <div style={{ display: "flex", background: "#0f1626", borderBottom: "1px solid #1c2540" }}>
              <div style={{ padding: "10px 18px", fontFamily: "var(--mono)", fontSize: 12, color: "#fff", background: "#080d19", borderRight: "1px solid #1c2540", borderBottom: "2px solid var(--blue)" }}>theme.css.ts</div>
              <div style={{ padding: "10px 18px", fontFamily: "var(--mono)", fontSize: 12, color: "#6b7389" }}>Button.css.ts</div>
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, padding: "0 14px" }}>
                <button style={{ background: "transparent", border: "none", color: "#9aa1b4", fontSize: 11, fontFamily: "var(--mono)", cursor: "pointer" }}>Copy</button>
              </div>
            </div>
            <pre style={{ margin: 0, padding: "18px 22px", fontFamily: "var(--mono)", fontSize: 13, lineHeight: 1.7, color: "#dbe2ff", overflow: "hidden" }}>
<span style={{ color: "#6b7389" }}>// 3-tier tokens, typed at the edge</span>{'\n'}
<span style={{ color: "#a48dff" }}>export const</span> <span style={{ color: "#8ab4ff" }}>colors</span> = <span style={{ color: "#8ab4ff" }}>createGlobalTheme</span>(<span style={{ color: "#b5e3a7" }}>':root'</span>, {'{'}{'\n'}
{'  '}<span style={{ color: "#8ab4ff" }}>accentEmphasis</span>: blue[<span style={{ color: "#ffb072" }}>500</span>],{'\n'}
{'}'});
            </pre>
          </div>
        </div>
      </div>
    </main>
  </div>
);

Object.assign(window, { PaperNotes, PaperProjects, PaperTag, PaperAbout, PaperSearch, PaperDark });
