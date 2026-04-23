// Variant C — Magazine Grid
// Home: Featured 대형 + 12컬럼 그리드 · Article: 플로팅 TOC 레일 + 편집 디자인 톤

const MagSidebar = ({ active = "home" }) => (
  <aside style={{ width: 200, padding: "36px 22px", borderRight: "1px solid var(--ink)", background: "#fff", display: "flex", flexDirection: "column", gap: 28, height: "100%", boxSizing: "border-box" }}>
    <div>
      <div style={{ fontSize: 10, fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: 0.18, color: "var(--ink-3)", marginBottom: 4 }}>est. 2022 · issue 42</div>
      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.4, lineHeight: 1 }}>vallista</div>
      <div style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--ink-3)", letterSpacing: 0.1, marginTop: 2 }}>— land.</div>
    </div>

    <nav style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {NAV.map((n, i) => (
        <a key={n.k} style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "11px 0", borderTop: i === 0 ? "1px solid var(--ink)" : "none",
          borderBottom: "1px solid var(--line-2)", textDecoration: "none",
          color: "var(--ink)", fontSize: 14, fontWeight: active === n.k ? 700 : 500, letterSpacing: -0.1,
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 10, fontFamily: "var(--mono)", color: "var(--ink-4)", width: 14 }}>{String(i + 1).padStart(2, "0")}</span>
            {n.label}
          </span>
          {active === n.k && <span style={{ color: "var(--blue)" }}>●</span>}
        </a>
      ))}
    </nav>

    <div>
      <div style={{ fontSize: 10, fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: 0.18, color: "var(--ink-3)", marginBottom: 10 }}>Issues / Series</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {SERIES.map(s => (
          <a key={s.k} style={{ fontSize: 13, color: "var(--ink-2)", textDecoration: "none", display: "flex", justifyContent: "space-between" }}>
            <span>{s.label}</span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-4)" }}>{String(s.count).padStart(2, "0")}</span>
          </a>
        ))}
      </div>
    </div>

    <div style={{ marginTop: "auto", fontSize: 10, fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: 0.18, color: "var(--ink-4)", lineHeight: 1.6 }}>
      Search ⌘K<br/>RSS · GH · @<br/>◐ Dark mode
    </div>
  </aside>
);

const MagHome = () => (
  <div style={{ display: "flex", height: "100%", background: "#fff", fontSize: 14 }}>
    <MagSidebar active="home" />
    <main style={{ flex: 1, padding: "0", overflow: "hidden" }}>
      {/* masthead */}
      <div style={{ padding: "28px 44px 14px", borderBottom: "1px solid var(--ink)", display: "flex", justifyContent: "space-between", alignItems: "baseline", fontFamily: "var(--mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.16, color: "var(--ink-3)" }}>
        <span>2024.11 · Issue 42</span>
        <span style={{ color: "var(--ink)", fontWeight: 600 }}>FRONTEND · CSS · MONOREPO · DX</span>
        <span>Wed · Cloudy 12°</span>
      </div>

      {/* featured */}
      <a style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr", borderBottom: "1px solid var(--ink)", textDecoration: "none", color: "inherit" }}>
        <div style={{ position: "relative", borderRight: "1px solid var(--ink)" }}>
          <Cover kind="blocks" ratio="5/3" />
          <div style={{ position: "absolute", top: 16, left: 16, fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.2, background: "var(--blue)", color: "#fff", padding: "3px 7px" }}>Cover Story</div>
        </div>
        <div style={{ padding: "32px 36px", display: "flex", flexDirection: "column", gap: 14, justifyContent: "center" }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.22, color: "var(--ink-3)" }}>Feature · DX 재정비 · 9 min</div>
          <h2 style={{ margin: 0, fontSize: 40, fontWeight: 800, letterSpacing: -0.8, lineHeight: 1.05 }}>왜 vanilla-<br/>extract으로<br/><span style={{ color: "var(--blue)" }}>옮겼는가</span></h2>
          <p style={{ margin: 0, color: "var(--ink-2)", lineHeight: 1.6, fontSize: 15 }}>런타임 CSS-in-JS는 편했지만, 모노레포의 빌드가 무거워질수록 초기 로드가 눈에 띄게 느려졌다.</p>
          <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-4)" }}>↗ Read · 2024.11.02</div>
        </div>
      </a>

      {/* 12-col grid */}
      <div style={{ padding: "32px 44px 44px", display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 20 }}>
        {/* large card */}
        <a style={{ gridColumn: "span 6", textDecoration: "none", color: "inherit" }}>
          <div style={{ aspectRatio: "16/9", borderBottom: "1px solid var(--ink)" }}><Cover kind="grid" /></div>
          <div style={{ padding: "14px 0" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.18, color: "var(--ink-3)", marginBottom: 6 }}>Article · 12 min</div>
            <h3 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: -0.3, lineHeight: 1.2 }}>모노레포를 다시 작게 쪼갰다</h3>
            <p style={{ margin: "6px 0 0", color: "var(--ink-2)", fontSize: 13.5, lineHeight: 1.55 }}>서비스 2개에 패키지 2개로 줄이고, 워크스페이스 구조를 새로 짜면서 배운 것들.</p>
          </div>
        </a>

        {/* 2 small stacked */}
        <div style={{ gridColumn: "span 3", display: "flex", flexDirection: "column", gap: 16 }}>
          {SAMPLE_POSTS.slice(2, 4).map(p => (
            <a key={p.title} style={{ textDecoration: "none", color: "inherit", paddingBottom: 12, borderBottom: "1px solid var(--line-2)" }}>
              <div style={{ aspectRatio: "4/3", marginBottom: 10 }}><Cover kind={p.cover} /></div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 4, letterSpacing: 0.16 }}>{p.tag} · {p.min} min</div>
              <h4 style={{ margin: 0, fontSize: 14.5, fontWeight: 700, letterSpacing: -0.1, lineHeight: 1.3 }}>{p.title}</h4>
            </a>
          ))}
        </div>

        {/* notes strip */}
        <div style={{ gridColumn: "span 3", background: "var(--blue-50)", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.2, color: "var(--blue-600)", fontWeight: 600 }}>From the notes</div>
          {NOTES.slice(0, 3).map((n, i) => (
            <div key={i} style={{ paddingBottom: 10, borderBottom: i < 2 ? "1px solid #d6e3ff" : "none" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--blue-600)", marginBottom: 3 }}>{n.date}</div>
              <div style={{ fontSize: 12, color: "var(--ink)", lineHeight: 1.5 }}>{n.text.slice(0, 52)}…</div>
            </div>
          ))}
        </div>

        {/* bottom row — list items */}
        {SAMPLE_POSTS.slice(4, 6).map(p => (
          <a key={p.title} style={{ gridColumn: "span 6", display: "grid", gridTemplateColumns: "140px 1fr", gap: 16, textDecoration: "none", color: "inherit", paddingTop: 20, borderTop: "1px solid var(--ink)" }}>
            <div style={{ aspectRatio: "4/3" }}><Cover kind={p.cover} /></div>
            <div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.16, color: "var(--ink-3)", marginBottom: 6 }}>{p.tag} · {p.date} · {p.min} min</div>
              <h4 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: -0.2, lineHeight: 1.25 }}>{p.title}</h4>
              {p.series && <div style={{ marginTop: 8 }}><Chip tone="blue">{p.series}</Chip></div>}
            </div>
          </a>
        ))}
      </div>
    </main>
  </div>
);

// ─── Article ────────────────────────────────────────────────
const MagArticle = () => (
  <div style={{ display: "flex", height: "100%", background: "#fff", fontSize: 14, position: "relative" }}>
    <MagSidebar active="articles" />
    <main style={{ flex: 1, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "var(--line-2)", zIndex: 2 }}>
        <div style={{ width: "34%", height: "100%", background: "var(--blue)" }} />
      </div>

      {/* floating TOC rail on left edge */}
      <aside style={{ position: "absolute", top: 160, left: 16, width: 110, fontSize: 11, zIndex: 3 }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 9.5, textTransform: "uppercase", letterSpacing: 0.18, color: "var(--ink-3)", marginBottom: 10, fontWeight: 600 }}>In this piece</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {["시작점","타이밍 문제","대안 비교","결과","앞으로"].map((t, i) => (
            <div key={t} style={{ display: "flex", gap: 6, alignItems: "flex-start", color: i === 1 ? "var(--blue)" : "var(--ink-3)" }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 9, fontWeight: 600, paddingTop: 1 }}>{String(i+1).padStart(2,"0")}</span>
              <span style={{ fontWeight: i === 1 ? 700 : 500, lineHeight: 1.35 }}>{t}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* header strip */}
      <div style={{ padding: "18px 60px 18px 160px", borderBottom: "1px solid var(--ink)", display: "flex", justifyContent: "space-between", fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.18, color: "var(--ink-3)" }}>
        <span>DX 재정비 · Chapter 1 of 4</span>
        <span>2024.11.02 · 9 min · 3,201 words</span>
        <span style={{ color: "var(--blue-600)" }}>◐ Dark · ⤴ Share</span>
      </div>

      <article style={{ maxWidth: 680, margin: "0 auto", padding: "56px 40px 120px" }}>
        <div style={{ marginBottom: 18 }}><Chip tone="blue">Feature · CSS · Monorepo</Chip></div>
        <h1 style={{ margin: "0 0 18px", fontSize: 52, fontWeight: 800, letterSpacing: -1, lineHeight: 1.02 }}>
          왜 vanilla-<br/>extract으로 <span style={{ color: "var(--blue)" }}>옮겼는가</span>
        </h1>
        <p style={{ margin: "0 0 36px", fontSize: 18, color: "var(--ink-2)", lineHeight: 1.5, maxWidth: 560 }}>
          런타임 비용을 지불하지 않으면서, 타입 안전한 스타일을 유지하는 가장 간단한 방법에 대한 기록.
        </p>

        <div style={{ fontSize: 17, lineHeight: 1.85, color: "var(--ink)" }}>
          <p style={{ margin: "0 0 22px" }}>
            <span style={{ float: "left", fontFamily: "var(--sans)", fontSize: 68, fontWeight: 800, lineHeight: 0.9, margin: "6px 10px 0 0", color: "var(--blue)", letterSpacing: -0.04 }}>처</span>
            음에는 Emotion으로 시작했다. 컴포넌트 옆에 스타일을 바로 쓸 수 있고, prop 기반 분기도 자연스러웠다. 그러다 앱이 커지고 모노레포에 패키지가 늘자, 번들의 스타일 런타임이 무거워지기 시작했다.
          </p>
          <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5, margin: "40px 0 14px" }}>문제는 번들이 아니라 타이밍이었다</h2>
          <p style={{ margin: "0 0 22px" }}>
            실제 크기가 크진 않았다. 문제는 첫 paint 전에 JS가 파싱·실행돼야만 스타일이 붙는다는 점이었다. 느린 네트워크에서는 레이아웃이 두 번 흔들렸다.
          </p>

          {/* pullquote */}
          <div style={{ margin: "36px -40px", padding: "28px 40px", borderTop: "2px solid var(--ink)", borderBottom: "2px solid var(--ink)", textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1.2, color: "var(--ink)" }}>
              "결국 타이밍이<br/><span style={{ color: "var(--blue)" }}>가장 비싼 리소스</span>다."
            </div>
            <div style={{ marginTop: 12, fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.2, color: "var(--ink-3)" }}>— from the piece</div>
          </div>

          {/* callout */}
          <div style={{ margin: "28px 0", padding: "18px 20px", background: "#fff", border: "1.5px solid var(--ink)", position: "relative" }}>
            <div style={{ position: "absolute", top: -10, left: 16, background: "#fff", padding: "0 8px", fontFamily: "var(--mono)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.18 }}>Note · 01</div>
            <div style={{ fontSize: 14.5, color: "var(--ink-2)", lineHeight: 1.7 }}>
              TTI 300ms 개선이 목표였고, 실제로는 CLS 쪽에서 더 큰 이득을 봤다. 숫자보다 사용자가 "덜 흔들린다"고 느끼는 게 중요했다.
            </div>
          </div>

          {/* code block — magazine style black header */}
          <div style={{ margin: "28px 0", border: "1px solid var(--ink)", overflow: "hidden" }}>
            <div style={{ display: "flex", background: "var(--ink)", color: "#fff" }}>
              <div style={{ padding: "9px 14px", fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600, letterSpacing: 0.08, borderRight: "1px solid #2a3250" }}>theme.css.ts</div>
              <div style={{ padding: "9px 14px", fontFamily: "var(--mono)", fontSize: 11, opacity: 0.55 }}>Button.css.ts</div>
              <div style={{ marginLeft: "auto", padding: "9px 14px", fontFamily: "var(--mono)", fontSize: 10, opacity: 0.55 }}>COPY</div>
            </div>
            <pre style={{ margin: 0, padding: "16px 18px", fontFamily: "var(--mono)", fontSize: 13, lineHeight: 1.7, background: "#fafbfc", color: "var(--ink)", overflow: "hidden" }}>
<span style={{ color: "#6b7389" }}>// 3-tier tokens</span>{'\n'}
<span style={{ color: "#8a4bff" }}>export const</span> <span style={{ color: "var(--blue-600)" }}>colors</span> = <span style={{ color: "var(--blue-600)" }}>createGlobalTheme</span>(<span style={{ color: "#2a7f3f" }}>':root'</span>, {'{'}{'\n'}
{'  '}<span style={{ color: "var(--blue-600)" }}>surfaceCanvas</span>: gray[<span style={{ color: "#b4541f" }}>50</span>],{'\n'}
{'  '}<span style={{ color: "var(--blue-600)" }}>accentEmphasis</span>: blue[<span style={{ color: "#b4541f" }}>500</span>],{'\n'}
{'}'});
            </pre>
          </div>

          <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5, margin: "40px 0 14px" }}>결과<sup style={{ color: "var(--blue)", fontSize: 14 }}>1</sup></h2>
          <p style={{ margin: "0 0 22px" }}>스타일 런타임을 완전히 뺐다. 번들 크기보다도 렌더 타이밍이 안정적으로 좋아졌다는 게 체감으로 컸다.</p>
        </div>

        {/* author + footnote strip */}
        <div style={{ marginTop: 48, paddingTop: 24, borderTop: "2px solid var(--ink)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
          <div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.18, color: "var(--ink-3)", marginBottom: 8 }}>By</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>@vallista</div>
            <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 4, lineHeight: 1.55 }}>프론트엔드 엔지니어. 지금 vallista-land 디자인 시스템을 다시 쓰는 중.</div>
          </div>
          <div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.18, color: "var(--ink-3)", marginBottom: 8 }}>Footnote</div>
            <div style={{ fontSize: 12.5, color: "var(--ink-3)", lineHeight: 1.6 }}>1. Lighthouse 12, moto g power 4G slow. 로컬 3회 평균.</div>
          </div>
        </div>

        {/* next in series — magazine style */}
        <div style={{ marginTop: 40, borderTop: "1px solid var(--line-2)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.2, color: "var(--blue-600)", fontWeight: 700, marginBottom: 4 }}>Next · DX 재정비 02 / 04</div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.3 }}>Sprinkles로 반응형 스타일링을 정리하다</div>
          </div>
          <div style={{ fontSize: 28, color: "var(--blue)" }}>→</div>
        </div>
      </article>
    </main>
  </div>
);

// ─── Mobile ─────────────────────────────────────────────────
const MagMobile = () => (
  <Phone>
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100% - 44px)" }}>
      <div style={{ padding: "14px 20px 10px", borderBottom: "1px solid var(--ink)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.3, lineHeight: 1 }}>vallista</div>
          <div style={{ fontSize: 9, fontFamily: "var(--mono)", color: "var(--ink-3)", letterSpacing: 0.16 }}>EST. 2022 · ISSUE 42</div>
        </div>
        <button style={{ border: "none", background: "transparent", fontSize: 22, cursor: "pointer" }}>×</button>
      </div>

      <div style={{ padding: "18px 20px 6px" }}>
        <div style={{ position: "relative" }}>
          <input placeholder="Search the archive" style={{ width: "100%", padding: "11px 12px 11px 36px", border: "1px solid var(--ink)", borderRadius: 0, fontSize: 14, boxSizing: "border-box", fontFamily: "inherit", color: "var(--ink)" }} />
          <svg style={{ position: "absolute", top: 13, left: 12 }} width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="var(--ink-4)" strokeWidth="1.4"><circle cx="6" cy="6" r="4.5"/><path d="M9.5 9.5L13 13"/></svg>
        </div>
      </div>

      <nav style={{ padding: "6px 20px 0", display: "flex", flexDirection: "column" }}>
        {NAV.map((n, i) => (
          <a key={n.k} style={{
            display: "flex", justifyContent: "space-between", alignItems: "baseline",
            padding: "14px 0", borderBottom: "1px solid var(--line-2)",
            textDecoration: "none", color: "var(--ink)",
          }}>
            <span style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-4)" }}>{String(i+1).padStart(2,"0")}</span>
              <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.4 }}>{n.label}</span>
            </span>
            {n.count != null && <span style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--ink-4)" }}>{n.count}</span>}
          </a>
        ))}
      </nav>

      <div style={{ padding: "18px 20px 0" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.18, color: "var(--ink-3)", marginBottom: 10 }}>Issues</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {SERIES.map(s => (
            <span key={s.k} style={{ fontSize: 12, padding: "5px 10px", border: "1px solid var(--ink)", color: "var(--ink)", fontWeight: 500 }}>{s.label} · {String(s.count).padStart(2,"0")}</span>
          ))}
        </div>
      </div>

      <div style={{ marginTop: "auto", padding: "16px 20px", borderTop: "1px solid var(--line-2)", display: "flex", justifyContent: "space-between", fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", color: "var(--ink-3)", letterSpacing: 0.16 }}>
        <span>RSS · GH · @</span>
        <span>◐ Dark</span>
      </div>
    </div>
  </Phone>
);

Object.assign(window, { MagHome, MagArticle, MagMobile });
