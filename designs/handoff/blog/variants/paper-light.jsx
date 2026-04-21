// Variant A — Paper Light
// v1 구조 유지 · 얇은 hairline · 넉넉한 여백 · 블루는 링크/진행바만

const PaperSidebar = ({ active = "home" }) => (
  <aside style={{ width: 220, padding: "40px 28px", borderRight: "1px solid var(--line-2)", background: "#fff", display: "flex", flexDirection: "column", gap: 36, height: "100%", boxSizing: "border-box" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <Mark size={22} />
      <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.1 }}>vallista-land</div>
    </div>
    <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {NAV.map(n => (
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
        {SERIES.map(s => (
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

const PaperSearchBar = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", border: "1px solid var(--line)", borderRadius: 8, background: "#fff", color: "var(--ink-4)", fontSize: 13, width: 280 }}>
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="6" cy="6" r="4.5"/><path d="M9.5 9.5L13 13"/></svg>
    <span>글 검색…</span>
    <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 11, padding: "1px 5px", border: "1px solid var(--line)", borderRadius: 3 }}>⌘K</span>
  </div>
);

const PaperHome = () => (
  <div style={{ display: "flex", height: "100%", background: "#fff", fontSize: 14 }}>
    <PaperSidebar active="home" />
    <main style={{ flex: 1, padding: "48px 64px 64px", overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 36 }}>
        <div>
          <div style={{ fontSize: 11, fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: 0.16, color: "var(--ink-4)", marginBottom: 8 }}>@vallista · 글</div>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700, letterSpacing: -0.5 }}>최근에 쓴 글</h1>
        </div>
        <PaperSearchBar />
      </div>

      {/* featured */}
      <a style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 32, marginBottom: 40, textDecoration: "none", color: "inherit" }}>
        <Cover kind="grid" />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 14 }}>
          <div style={{ display: "flex", gap: 6 }}>
            <Chip tone="blue">Featured</Chip>
            <Chip>Article · 9 min</Chip>
          </div>
          <h2 style={{ margin: 0, fontSize: 30, fontWeight: 700, letterSpacing: -0.4, lineHeight: 1.2 }}>왜 vanilla-extract으로<br/>옮겼는가</h2>
          <p style={{ margin: 0, color: "var(--ink-2)", lineHeight: 1.65, fontSize: 15 }}>런타임 CSS-in-JS는 편했지만, 모노레포의 빌드가 무거워질수록 초기 로드가 눈에 띄게 느려졌다. 제로런타임으로 옮기면서 정리한 것들.</p>
          <div style={{ fontSize: 12, color: "var(--ink-4)", fontFamily: "var(--mono)" }}>2024.11.02 · DX 재정비 시리즈</div>
        </div>
      </a>

      <div style={{ height: 1, background: "var(--line-2)", margin: "8px 0 28px" }} />

      {/* list */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "28px 40px" }}>
        {SAMPLE_POSTS.slice(1, 5).map(p => (
          <a key={p.title} style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 18, textDecoration: "none", color: "inherit" }}>
            <div style={{ aspectRatio: "4/3" }}><Cover kind={p.cover} /></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--ink-4)" }}>{p.date} · {p.min} min</div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, letterSpacing: -0.2, lineHeight: 1.3 }}>{p.title}</h3>
              <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                <Chip>{p.tag}</Chip>
                {p.series && <Chip tone="blue">{p.series}</Chip>}
              </div>
            </div>
          </a>
        ))}
      </div>
    </main>
  </div>
);

// ─── Article ────────────────────────────────────────────────
const PaperArticle = () => (
  <div style={{ display: "flex", height: "100%", background: "#fff", fontSize: 14 }}>
    <PaperSidebar active="articles" />
    <main style={{ flex: 1, position: "relative", overflow: "hidden" }}>
      {/* reading progress */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "var(--line-2)" }}>
        <div style={{ width: "34%", height: "100%", background: "var(--blue)" }} />
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "72px 40px 120px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <Chip tone="blue">DX 재정비 · 1/4</Chip>
          <Chip>CSS</Chip>
        </div>
        <h1 style={{ margin: "0 0 14px", fontSize: 44, fontWeight: 700, letterSpacing: -0.8, lineHeight: 1.15 }}>왜 vanilla-extract으로 옮겼는가</h1>
        <p style={{ margin: "0 0 28px", fontSize: 18, color: "var(--ink-2)", lineHeight: 1.55 }}>
          런타임 비용을 지불하지 않으면서, 타입 안전한 스타일을 유지하는 가장 간단한 방법에 대한 기록.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 13, color: "var(--ink-3)", fontFamily: "var(--mono)", paddingBottom: 32, borderBottom: "1px solid var(--line-2)" }}>
          <span>2024.11.02</span>
          <span>·</span>
          <span>9 min read</span>
          <span>·</span>
          <span>3,201 words</span>
        </div>

        <div style={{ fontSize: 17, lineHeight: 1.85, color: "var(--ink)", marginTop: 36 }}>
          <p style={{ margin: "0 0 22px" }}>
            처음에는 <a style={{ color: "var(--blue)", textDecoration: "none", borderBottom: "1px solid var(--blue)" }}>Emotion</a>으로 시작했다. 컴포넌트 옆에 스타일을 바로 쓸 수 있고, prop 기반 분기도 자연스러웠다. 그러다 앱이 커지고 모노레포에 패키지가 늘자, 번들의 스타일 런타임이 무거워지기 시작했다.
          </p>
          <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.3, margin: "44px 0 14px" }}>문제는 번들이 아니라 타이밍이었다</h2>
          <p style={{ margin: "0 0 22px" }}>
            실제 크기가 크진 않았다. 문제는 첫 paint 전에 JS가 파싱·실행돼야만 <em style={{ fontStyle: "normal", color: "var(--blue-600)", fontWeight: 600 }}>스타일이 붙는다</em>는 점이었다. 느린 네트워크에서는 레이아웃이 두 번 흔들렸다.
          </p>

          {/* callout */}
          <div style={{ margin: "28px 0", padding: "18px 22px", background: "var(--blue-50)", borderLeft: "3px solid var(--blue)", borderRadius: "2px 6px 6px 2px", color: "var(--ink-2)", fontSize: 15.5, lineHeight: 1.7 }}>
            <strong style={{ color: "var(--blue-600)" }}>NOTE </strong>
            TTI 300ms 개선이 목표였고, 실제로는 CLS 쪽에서 더 큰 이득을 봤다. 숫자보다 사용자가 "덜 흔들린다"고 느끼는 게 중요했다.
          </div>

          <p style={{ margin: "0 0 22px" }}>
            그래서 제로런타임을 다시 봤다. 옵션은 세 개였다 — Linaria, Panda CSS, vanilla-extract. 결론은 타입 세이프티가 가장 센 vanilla-extract였다.
          </p>

          {/* code block with filename tabs */}
          <div style={{ margin: "28px 0", borderRadius: 10, overflow: "hidden", border: "1px solid var(--line)", background: "#0b1220" }}>
            <div style={{ display: "flex", background: "#0f1626", borderBottom: "1px solid #1c2540" }}>
              <div style={{ padding: "10px 18px", fontFamily: "var(--mono)", fontSize: 12, color: "#fff", background: "#0b1220", borderRight: "1px solid #1c2540", borderBottom: "2px solid var(--blue)" }}>theme.css.ts</div>
              <div style={{ padding: "10px 18px", fontFamily: "var(--mono)", fontSize: 12, color: "#6b7389" }}>Button.css.ts</div>
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, padding: "0 14px", color: "#6b7389" }}>
                <button style={{ background: "transparent", border: "none", color: "#9aa1b4", fontSize: 11, fontFamily: "var(--mono)", cursor: "pointer", padding: "6px 10px", borderRadius: 4 }}>Copy</button>
              </div>
            </div>
            <pre style={{ margin: 0, padding: "18px 22px", fontFamily: "var(--mono)", fontSize: 13, lineHeight: 1.7, color: "#dbe2ff", overflow: "hidden" }}>
<span style={{ color: "#6b7389" }}>// 3-tier tokens, typed at the edge</span>{'\n'}
<span style={{ color: "#a48dff" }}>export const</span> <span style={{ color: "#8ab4ff" }}>colors</span> = <span style={{ color: "#8ab4ff" }}>createGlobalTheme</span>(<span style={{ color: "#b5e3a7" }}>':root'</span>, {'{'}{'\n'}
{'  '}<span style={{ color: "#8ab4ff" }}>surfaceCanvas</span>: gray[<span style={{ color: "#ffb072" }}>50</span>],{'\n'}
{'  '}<span style={{ color: "#8ab4ff" }}>textPrimary</span>:   gray[<span style={{ color: "#ffb072" }}>900</span>],{'\n'}
{'  '}<span style={{ color: "#8ab4ff" }}>accentEmphasis</span>: blue[<span style={{ color: "#ffb072" }}>500</span>],{'\n'}
{'}'});
            </pre>
          </div>

          <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.3, margin: "44px 0 14px" }}>결과<sup style={{ color: "var(--blue)", fontWeight: 600, fontSize: 13 }}>1</sup></h2>
          <p style={{ margin: "0 0 22px" }}>
            초기 로드에서 스타일 런타임을 완전히 뺐다. 번들 크기보다도, 렌더 타이밍이 안정적으로 좋아졌다는 게 체감으로 컸다.
          </p>
        </div>

        {/* footnotes */}
        <div style={{ marginTop: 56, paddingTop: 24, borderTop: "1px solid var(--line-2)", fontSize: 13, color: "var(--ink-3)", lineHeight: 1.7 }}>
          <div style={{ fontSize: 11, fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: 0.14, color: "var(--ink-4)", marginBottom: 10 }}>Footnotes</div>
          <ol style={{ margin: 0, paddingLeft: 20 }}>
            <li>측정 환경: Lighthouse 12, moto g power 4G slow profile. 로컬 3회 평균.</li>
          </ol>
        </div>

        {/* next in series */}
        <div style={{ marginTop: 48, padding: "22px 26px", border: "1px solid var(--line)", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: 0.14, color: "var(--ink-4)", marginBottom: 6 }}>Next in DX 재정비</div>
            <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: -0.2 }}>Sprinkles로 반응형 스타일링을 정리하다</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>6 min · 2/4</div>
          </div>
          <div style={{ color: "var(--blue)", fontSize: 20 }}>→</div>
        </div>
      </div>

      {/* floating TOC */}
      <aside style={{ position: "absolute", top: 100, right: 40, width: 220, fontSize: 12 }}>
        <div style={{ fontSize: 11, fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: 0.14, color: "var(--ink-4)", marginBottom: 12 }}>On this page</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, borderLeft: "1px solid var(--line)", paddingLeft: 14 }}>
          <div style={{ color: "var(--ink-4)" }}>1. 시작점</div>
          <div style={{ color: "var(--blue)", fontWeight: 600, marginLeft: -15, paddingLeft: 14, borderLeft: "2px solid var(--blue)" }}>2. 문제는 번들이 아니라 타이밍</div>
          <div style={{ color: "var(--ink-4)" }}>3. 대안 비교</div>
          <div style={{ color: "var(--ink-4)" }}>4. 결과</div>
          <div style={{ color: "var(--ink-4)" }}>5. 앞으로</div>
        </div>
      </aside>
    </main>
  </div>
);

// ─── Mobile — Menu open (hamburger → fullscreen) ───────────
const PaperMobile = () => (
  <Phone>
    <div style={{ padding: "0 22px", display: "flex", flexDirection: "column", height: "calc(100% - 44px)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Mark size={20} />
          <div style={{ fontSize: 14, fontWeight: 600 }}>vallista-land</div>
        </div>
        <button style={{ border: "none", background: "transparent", fontSize: 22, color: "var(--ink)", cursor: "pointer", padding: 4 }}>×</button>
      </div>
      <div style={{ position: "relative", marginBottom: 24 }}>
        <input placeholder="글 검색…" style={{ width: "100%", padding: "12px 14px 12px 40px", border: "1px solid var(--line)", borderRadius: 10, fontSize: 15, boxSizing: "border-box", fontFamily: "inherit", color: "var(--ink)" }} />
        <svg style={{ position: "absolute", top: 14, left: 14 }} width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--ink-4)" strokeWidth="1.4"><circle cx="6" cy="6" r="4.5"/><path d="M9.5 9.5L13 13"/></svg>
      </div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 0, borderTop: "1px solid var(--line-2)" }}>
        {NAV.map(n => (
          <a key={n.k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 4px", borderBottom: "1px solid var(--line-2)", textDecoration: "none", color: "var(--ink)", fontSize: 20, fontWeight: 600, letterSpacing: -0.3 }}>
            <span>{n.label}</span>
            {n.count != null && <span style={{ fontSize: 12, color: "var(--ink-4)", fontFamily: "var(--mono)", fontWeight: 500 }}>{n.count}</span>}
          </a>
        ))}
      </nav>
      <div style={{ marginTop: 28 }}>
        <div style={{ fontSize: 11, fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: 0.16, color: "var(--ink-4)", marginBottom: 12 }}>Series</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {SERIES.map(s => <Chip key={s.k} tone="blue">{s.label} · {s.count}</Chip>)}
        </div>
      </div>
      <div style={{ marginTop: "auto", paddingTop: 20, fontSize: 11, fontFamily: "var(--mono)", color: "var(--ink-4)" }}>
        © 2024 · RSS · GitHub
      </div>
    </div>
  </Phone>
);

Object.assign(window, { PaperHome, PaperArticle, PaperMobile });
