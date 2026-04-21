// Variant E — Paper × Docs
// Paper Light 공기감·큰 타이포 + Docs 사이드바 구조(Search/Series 접이식/Tags) · sticky TOC · Breadcrumb

const { SAMPLE_POSTS: PDPosts, NOTES: PDNotes, SERIES: PDSeries, TAGS: PDTags, Cover: PDCover, Mark: PDMark, Chip: PDChip, Phone: PDPhone } = window;

// Docs-like sidebar but AIRIER: thinner hairlines, more whitespace, paper serif-ish titles
const PDSidebar = ({ active = "home" }) => (
  <aside style={{ width: 252, padding: "36px 28px 28px", borderRight: "1px solid var(--line-2)", background: "#fff", display: "flex", flexDirection: "column", gap: 30, height: "100%", boxSizing: "border-box", overflow: "auto" }}>
    {/* brand */}
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <PDMark size={22} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.2 }}>vallista-land</div>
          <div style={{ fontSize: 10, fontFamily: "var(--mono)", color: "var(--ink-4)", letterSpacing: 0.14, textTransform: "uppercase" }}>Notes on building</div>
        </div>
      </div>
    </div>

    {/* command bar */}
    <div style={{ position: "relative" }}>
      <input placeholder="글 검색…" style={{ width: "100%", padding: "9px 12px 9px 32px", border: "1px solid var(--line-2)", borderRadius: 7, fontSize: 12.5, boxSizing: "border-box", fontFamily: "inherit", background: "#fafbfc" }} />
      <svg style={{ position: "absolute", top: 11, left: 10 }} width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="var(--ink-4)" strokeWidth="1.4"><circle cx="6" cy="6" r="4.5"/><path d="M9.5 9.5L13 13"/></svg>
      <span style={{ position: "absolute", top: 8, right: 8, fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-4)", border: "1px solid var(--line-2)", borderRadius: 4, padding: "2px 5px", background: "#fff" }}>⌘K</span>
    </div>

    {/* Primary nav — airy list, NO backgrounds, just type weight */}
    <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {[
        { k: "home", label: "Home" },
        { k: "articles", label: "Articles", count: 42 },
        { k: "notes", label: "Notes", count: 28 },
        { k: "projects", label: "Projects", count: 6 },
        { k: "about", label: "About" },
      ].map(n => (
        <a key={n.k} style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "7px 0", textDecoration: "none",
          color: active === n.k ? "var(--ink)" : "var(--ink-2)",
          fontWeight: active === n.k ? 600 : 500,
          fontSize: 14,
          borderLeft: active === n.k ? "2px solid var(--blue)" : "2px solid transparent",
          paddingLeft: 10,
        }}>
          <span>{n.label}</span>
          {n.count != null && <span style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--ink-4)" }}>{n.count}</span>}
        </a>
      ))}
    </nav>

    {/* Series — collapsible */}
    <div>
      <button style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "6px 0", border: "none", background: "transparent", cursor: "pointer", fontFamily: "var(--mono)", fontSize: 10.5, letterSpacing: 0.2, textTransform: "uppercase", color: "var(--ink-4)", fontWeight: 600 }}>
        <span>Series ({PDSeries.length})</span>
        <span style={{ fontSize: 10 }}>▾</span>
      </button>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 8, paddingLeft: 2 }}>
        {PDSeries.map((s, i) => (
          <a key={s.k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", borderLeft: i === 0 ? "2px solid var(--blue)" : "2px solid transparent", color: "var(--ink-2)", textDecoration: "none", fontSize: 13, fontWeight: i === 0 ? 600 : 500 }}>
            <span style={{ color: i === 0 ? "var(--ink)" : "var(--ink-2)" }}>{s.label}</span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--ink-4)" }}>{String(s.count).padStart(2,"0")}</span>
          </a>
        ))}
      </div>
    </div>

    {/* Tags — chips */}
    <div>
      <button style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "6px 0", border: "none", background: "transparent", cursor: "pointer", fontFamily: "var(--mono)", fontSize: 10.5, letterSpacing: 0.2, textTransform: "uppercase", color: "var(--ink-4)", fontWeight: 600 }}>
        <span>Tags</span>
        <span style={{ fontSize: 10 }}>▾</span>
      </button>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
        {PDTags.map(t => (
          <span key={t.k} style={{ display: "inline-flex", gap: 5, padding: "3px 8px", border: "1px solid var(--line-2)", borderRadius: 999, fontSize: 11, color: "var(--ink-2)", background: "#fff" }}>
            {t.label}<span style={{ color: "var(--ink-4)", fontFamily: "var(--mono)" }}>{t.count}</span>
          </span>
        ))}
      </div>
    </div>

    <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-4)", letterSpacing: 0.12, textTransform: "uppercase" }}>
      <span>RSS · GH · @</span>
      <span>◐ Dark</span>
    </div>
  </aside>
);

// ─── Home ───────────────────────────────────────────────────
const PDHome = () => (
  <div style={{ display: "flex", height: "100%", background: "#fff", fontSize: 14 }}>
    <PDSidebar active="home" />
    <main style={{ flex: 1, overflow: "hidden", padding: "48px 72px 64px" }}>
      {/* breadcrumb (docs pattern) — but very light */}
      <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-4)", letterSpacing: 0.12, marginBottom: 28 }}>
        @vallista <span style={{ margin: "0 8px", color: "var(--line)" }}>/</span> Home
      </div>

      {/* Big airy title — Paper Light style */}
      <h1 style={{ margin: 0, fontSize: 60, fontWeight: 700, letterSpacing: -1.2, lineHeight: 1.05 }}>
        최근에<br/>쓴 글<span style={{ color: "var(--blue)" }}>.</span>
      </h1>
      <p style={{ margin: "20px 0 48px", color: "var(--ink-3)", fontSize: 16, maxWidth: 540, lineHeight: 1.6 }}>
        주로 프론트엔드·디자인 시스템·개인 도구. 2024년부터 시리즈 단위로 묶고 있어요.
      </p>

      {/* Featured — airy, minimal */}
      <a style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 40, padding: "32px 0", borderTop: "1px solid var(--ink)", borderBottom: "1px solid var(--line-2)", textDecoration: "none", color: "inherit", marginBottom: 36 }}>
        <div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: 0.2, color: "var(--blue-600)", fontWeight: 700, marginBottom: 14 }}>Featured · DX 재정비 01/04</div>
          <h2 style={{ margin: "0 0 16px", fontSize: 34, fontWeight: 700, letterSpacing: -0.6, lineHeight: 1.15 }}>왜 vanilla-extract으로 옮겼는가</h2>
          <p style={{ margin: 0, color: "var(--ink-2)", lineHeight: 1.65, fontSize: 15 }}>런타임 CSS-in-JS는 편했지만, 모노레포의 빌드가 무거워질수록 초기 로드가 눈에 띄게 느려졌다. 1년 간의 정리 기록.</p>
          <div style={{ marginTop: 18, display: "flex", gap: 10, alignItems: "center", fontSize: 12, fontFamily: "var(--mono)", color: "var(--ink-4)", letterSpacing: 0.1 }}>
            <span>2024.11.02</span>·<span>9 MIN</span>·<span>3,201 WORDS</span>
          </div>
        </div>
        <div><PDCover kind="blocks" ratio="5/3" /></div>
      </a>

      {/* Rest — airy two-column list, numbered, no chrome */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 48px" }}>
        {PDPosts.slice(1).map((p, i) => (
          <a key={p.title} style={{ padding: "24px 0", borderTop: "1px solid var(--line-2)", textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--ink-4)", letterSpacing: 0.12 }}>№ {String(i+2).padStart(2,"0")} · {p.date}</span>
              <span style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--ink-4)" }}>{p.min} min</span>
            </div>
            <h3 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: -0.3, lineHeight: 1.22 }}>{p.title}</h3>
            <p style={{ margin: 0, fontSize: 13.5, color: "var(--ink-3)", lineHeight: 1.6 }}>{p.excerpt}</p>
            <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
              <PDChip>{p.tag}</PDChip>
              {p.series && <PDChip tone="blue">{p.series}</PDChip>}
            </div>
          </a>
        ))}
      </div>
    </main>
  </div>
);

// ─── Article ────────────────────────────────────────────────
const PDArticle = () => (
  <div style={{ display: "flex", height: "100%", background: "#fff", fontSize: 14 }}>
    <PDSidebar active="articles" />
    <main style={{ flex: 1, position: "relative", overflow: "hidden", display: "grid", gridTemplateColumns: "1fr 220px" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "var(--line-2)", zIndex: 2 }}>
        <div style={{ width: "42%", height: "100%", background: "var(--blue)" }} />
      </div>

      <div style={{ padding: "56px 48px 120px", minWidth: 0 }}>
        {/* breadcrumb */}
        <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-4)", letterSpacing: 0.12, marginBottom: 28, display: "flex", alignItems: "center", gap: 8 }}>
          <span>@vallista</span><span style={{ color: "var(--line)" }}>/</span>
          <span>articles</span><span style={{ color: "var(--line)" }}>/</span>
          <span style={{ color: "var(--blue-600)" }}>dx-revisit</span><span style={{ color: "var(--line)" }}>/</span>
          <span style={{ color: "var(--ink)" }}>01-vanilla-extract</span>
        </div>

        <div style={{ maxWidth: 680 }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: 0.22, color: "var(--blue-600)", fontWeight: 700, marginBottom: 16 }}>DX 재정비 · Chapter 1 of 4</div>
          <h1 style={{ margin: 0, fontSize: 52, fontWeight: 700, letterSpacing: -1, lineHeight: 1.08 }}>
            왜 vanilla-extract으로 <span style={{ color: "var(--blue)" }}>옮겼는가</span>
          </h1>
          <p style={{ margin: "20px 0 28px", fontSize: 18, color: "var(--ink-2)", lineHeight: 1.55 }}>
            런타임 비용을 지불하지 않으면서, 타입 안전한 스타일을 유지하는 가장 간단한 방법에 대한 기록.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 12, color: "var(--ink-3)", fontFamily: "var(--mono)", paddingBottom: 24, borderBottom: "1px solid var(--line-2)", letterSpacing: 0.1 }}>
            <span>2024.11.02</span>·<span>9 MIN</span>·<span>3,201 WORDS</span>
            <span style={{ marginLeft: "auto" }}><a style={{ color: "var(--blue-600)", textDecoration: "none" }}>✎ Edit on GitHub</a></span>
          </div>

          <div style={{ fontSize: 17, lineHeight: 1.85, color: "var(--ink)", marginTop: 36 }}>
            <p style={{ margin: "0 0 22px" }}>처음에는 Emotion으로 시작했다. 컴포넌트 옆에 스타일을 바로 쓸 수 있고, prop 기반 분기도 자연스러웠다. 그러다 앱이 커지고 모노레포에 패키지가 늘자, 번들의 스타일 런타임이 무거워지기 시작했다.</p>

            <h2 id="h-timing" style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.4, margin: "44px 0 14px", scrollMarginTop: 80 }}>문제는 번들이 아니라 <span style={{ color: "var(--blue)" }}>타이밍</span>이었다</h2>
            <p style={{ margin: "0 0 22px" }}>실제 크기가 크진 않았다. 문제는 첫 paint 전에 JS가 파싱·실행돼야만 스타일이 붙는다는 점이었다. 느린 네트워크에서는 레이아웃이 두 번 흔들렸다.</p>

            {/* code block */}
            <div style={{ margin: "28px 0", border: "1px solid var(--line)", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ display: "flex", background: "#fafbfc", borderBottom: "1px solid var(--line-2)" }}>
                <div style={{ padding: "9px 14px", fontFamily: "var(--mono)", fontSize: 11.5, fontWeight: 600, color: "var(--ink)", background: "#fff", borderRight: "1px solid var(--line-2)" }}>theme.css.ts</div>
                <div style={{ padding: "9px 14px", fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--ink-4)" }}>Button.css.ts</div>
                <div style={{ marginLeft: "auto", padding: "6px 10px" }}>
                  <button style={{ border: "1px solid var(--line)", background: "#fff", borderRadius: 5, padding: "3px 9px", fontSize: 10.5, color: "var(--ink-3)", cursor: "pointer", fontFamily: "var(--mono)" }}>COPY</button>
                </div>
              </div>
              <pre style={{ margin: 0, padding: "14px 16px", fontFamily: "var(--mono)", fontSize: 12.5, lineHeight: 1.75, background: "#fff", color: "var(--ink)", overflow: "hidden" }}>
<span style={{ color: "#6b7389" }}>// 3-tier tokens</span>{'\n'}
<span style={{ color: "#8a4bff" }}>export const</span> <span style={{ color: "var(--blue-600)" }}>colors</span> = <span style={{ color: "var(--blue-600)" }}>createGlobalTheme</span>(<span style={{ color: "#2a7f3f" }}>':root'</span>, {'{'}{'\n'}
{'  '}<span style={{ color: "var(--blue-600)" }}>surfaceCanvas</span>: gray[<span style={{ color: "#b4541f" }}>50</span>],{'\n'}
{'  '}<span style={{ color: "var(--blue-600)" }}>accentEmphasis</span>: blue[<span style={{ color: "#b4541f" }}>500</span>],{'\n'}
{'}'});
              </pre>
            </div>

            {/* callout */}
            <div style={{ margin: "28px 0", padding: "14px 18px", background: "var(--blue-50)", borderLeft: "2px solid var(--blue)", display: "flex", gap: 12 }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, fontWeight: 700, color: "var(--blue-600)", letterSpacing: 0.2, paddingTop: 2, flexShrink: 0 }}>NOTE · 01</div>
              <div style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.65 }}>TTI 300ms 개선이 목표였고, 실제로는 CLS 쪽에서 더 큰 이득을 봤다. 숫자보다 사용자가 "덜 흔들린다"고 느끼는 게 중요했다.</div>
            </div>

            <h2 id="h-result" style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.4, margin: "44px 0 14px", scrollMarginTop: 80 }}>결과</h2>
            <p style={{ margin: "0 0 22px" }}>스타일 런타임을 완전히 뺐다. 번들 크기보다도 렌더 타이밍이 안정적으로 좋아졌다는 게 체감으로 컸다.</p>
          </div>

          {/* next in series */}
          <a style={{ marginTop: 44, padding: "24px 0", borderTop: "1px solid var(--ink)", display: "flex", justifyContent: "space-between", alignItems: "center", textDecoration: "none", color: "inherit" }}>
            <div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: 0.22, color: "var(--blue-600)", fontWeight: 700, marginBottom: 6 }}>Next · DX 재정비 02 / 04</div>
              <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.3 }}>Sprinkles로 반응형 스타일링을 정리하다</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 4, fontFamily: "var(--mono)" }}>6 min · 2024.11.10</div>
            </div>
            <div style={{ fontSize: 24, color: "var(--blue)" }}>→</div>
          </a>
        </div>
      </div>

      {/* Sticky TOC — right rail, airy */}
      <aside style={{ borderLeft: "1px solid var(--line-2)", padding: "64px 22px 40px", fontSize: 12.5, background: "#fff", position: "sticky", top: 0, alignSelf: "start", height: "100%", boxSizing: "border-box" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.22, color: "var(--ink-4)", marginBottom: 14, fontWeight: 700 }}>On this page</div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <a style={{ display: "block", padding: "6px 10px", borderLeft: "2px solid var(--blue)", color: "var(--ink)", textDecoration: "none", fontSize: 12.5, fontWeight: 600 }}>문제는 번들이 아니라 타이밍이었다</a>
          <a style={{ display: "block", padding: "6px 10px", borderLeft: "2px solid transparent", color: "var(--ink-3)", textDecoration: "none", fontSize: 12.5 }}>결과</a>
        </nav>

        <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.22, color: "var(--ink-4)", margin: "36px 0 14px", fontWeight: 700 }}>Series · 1 / 4</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {[
            { n: 1, t: "왜 vanilla-extract으로 옮겼는가", active: true },
            { n: 2, t: "Sprinkles로 반응형 정리" },
            { n: 3, t: "RSC로 밀어낸 것들" },
            { n: 4, t: "남은 번들 예산" },
          ].map(s => (
            <a key={s.n} style={{ display: "flex", gap: 8, padding: "6px 10px", borderLeft: s.active ? "2px solid var(--blue)" : "2px solid transparent", textDecoration: "none", color: s.active ? "var(--ink)" : "var(--ink-3)", fontSize: 12.5, fontWeight: s.active ? 600 : 500 }}>
              <span style={{ fontFamily: "var(--mono)", color: "var(--ink-4)", fontSize: 10.5 }}>{String(s.n).padStart(2,"0")}</span>
              <span>{s.t}</span>
            </a>
          ))}
        </div>

        <div style={{ marginTop: 36, paddingTop: 18, borderTop: "1px solid var(--line-2)", display: "flex", flexDirection: "column", gap: 8, fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-4)", letterSpacing: 0.1 }}>
          <a style={{ color: "var(--blue-600)", textDecoration: "none" }}>↑ Top</a>
          <a style={{ color: "var(--ink-3)", textDecoration: "none" }}>✎ Edit on GitHub</a>
        </div>
      </aside>
    </main>
  </div>
);

// ─── Mobile ─────────────────────────────────────────────────
const PDMobile = () => (
  <PDPhone>
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100% - 44px)" }}>
      <div style={{ padding: "14px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--line-2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <PDMark size={20} />
          <div style={{ fontSize: 14, fontWeight: 600 }}>vallista-land</div>
        </div>
        <button style={{ border: "none", background: "transparent", fontSize: 22, cursor: "pointer" }}>×</button>
      </div>

      <div style={{ padding: "16px 22px 6px" }}>
        <div style={{ position: "relative" }}>
          <input placeholder="글 검색…" style={{ width: "100%", padding: "11px 12px 11px 38px", border: "1px solid var(--line)", borderRadius: 10, fontSize: 14.5, boxSizing: "border-box", fontFamily: "inherit", background: "#fafbfc" }} />
          <svg style={{ position: "absolute", top: 13, left: 13 }} width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--ink-4)" strokeWidth="1.4"><circle cx="6" cy="6" r="4.5"/><path d="M9.5 9.5L13 13"/></svg>
        </div>
      </div>

      <nav style={{ padding: "8px 22px 0", display: "flex", flexDirection: "column" }}>
        {[
          { k: "home", label: "Home", active: true },
          { k: "articles", label: "Articles", count: 42 },
          { k: "notes", label: "Notes", count: 28 },
          { k: "projects", label: "Projects", count: 6 },
          { k: "about", label: "About" },
        ].map(n => (
          <a key={n.k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 10px", borderLeft: n.active ? "2px solid var(--blue)" : "2px solid transparent", textDecoration: "none", color: "var(--ink)" }}>
            <span style={{ fontSize: 17, fontWeight: n.active ? 600 : 500, letterSpacing: -0.2 }}>{n.label}</span>
            {n.count != null && <span style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--ink-4)" }}>{n.count}</span>}
          </a>
        ))}
      </nav>

      <div style={{ padding: "18px 22px 0" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.2, color: "var(--ink-4)", marginBottom: 10, fontWeight: 700 }}>Series</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {PDSeries.map((s, i) => (
            <div key={s.k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 10px", borderLeft: i === 0 ? "2px solid var(--blue)" : "2px solid transparent" }}>
              <span style={{ fontSize: 13.5, color: i === 0 ? "var(--ink)" : "var(--ink-2)", fontWeight: i === 0 ? 600 : 500 }}>{s.label}</span>
              <span style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--ink-4)" }}>{String(s.count).padStart(2,"0")}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "16px 22px 0" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.2, color: "var(--ink-4)", marginBottom: 10, fontWeight: 700 }}>Tags</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {PDTags.map(t => (
            <span key={t.k} style={{ display: "inline-flex", gap: 5, padding: "4px 9px", border: "1px solid var(--line-2)", borderRadius: 999, fontSize: 11, color: "var(--ink-2)", background: "#fff" }}>
              {t.label}<span style={{ color: "var(--ink-4)", fontFamily: "var(--mono)" }}>{t.count}</span>
            </span>
          ))}
        </div>
      </div>

      <div style={{ marginTop: "auto", padding: "16px 22px", borderTop: "1px solid var(--line-2)", display: "flex", justifyContent: "space-between", fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", color: "var(--ink-4)", letterSpacing: 0.18 }}>
        <span>RSS · GH · @</span>
        <span>◐ Dark</span>
      </div>
    </div>
  </PDPhone>
);

Object.assign(window, { PDHome, PDArticle, PDMobile });
