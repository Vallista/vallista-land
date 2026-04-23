// Variant D — Paper × Magazine
// Paper Light 여백감 · 얇은 hairline + Magazine Issue 넘버링 · Featured 대형 · pullquote

const { SAMPLE_POSTS: PMPosts, NOTES: PMNotes, NAV: PMNav, SERIES: PMSeries, Cover: PMCover, Mark: PMMark, Chip: PMChip, Phone: PMPhone } = window;

const PMSidebar = ({ active = "home" }) => (
  <aside style={{ width: 220, padding: "40px 28px", borderRight: "1px solid var(--line-2)", background: "#fff", display: "flex", flexDirection: "column", gap: 32, height: "100%", boxSizing: "border-box" }}>
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <PMMark size={22} />
        <div style={{ fontSize: 14, fontWeight: 600 }}>vallista-land</div>
      </div>
      <div style={{ fontSize: 10.5, fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: 0.18, color: "var(--ink-4)", marginTop: 10 }}>est. 2022 · Issue 42</div>
    </div>

    <nav style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {PMNav.map((n, i) => (
        <a key={n.k} style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "10px 0", borderBottom: "1px solid var(--line-2)",
          textDecoration: "none", fontSize: 14,
          color: active === n.k ? "var(--ink)" : "var(--ink-2)",
          fontWeight: active === n.k ? 700 : 500,
        }}>
          <span style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-4)", width: 16 }}>{String(i+1).padStart(2,"0")}</span>
            {n.label}
          </span>
          {n.count != null && <span style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--ink-4)" }}>{n.count}</span>}
        </a>
      ))}
    </nav>

    <div>
      <div style={{ fontSize: 10.5, fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: 0.18, color: "var(--ink-4)", marginBottom: 12 }}>Series</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {PMSeries.map(s => (
          <a key={s.k} style={{ fontSize: 13, color: "var(--ink-2)", textDecoration: "none", display: "flex", justifyContent: "space-between" }}>
            <span>{s.label}</span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-4)" }}>{String(s.count).padStart(2,"0")}</span>
          </a>
        ))}
      </div>
    </div>

    <div style={{ marginTop: "auto", fontSize: 11, fontFamily: "var(--mono)", color: "var(--ink-4)", display: "flex", flexDirection: "column", gap: 4 }}>
      <span>Search ⌘K</span>
      <span>RSS · GitHub · Email</span>
      <span>◐ Dark</span>
    </div>
  </aside>
);

const PMHome = () => (
  <div style={{ display: "flex", height: "100%", background: "#fff", fontSize: 14 }}>
    <PMSidebar active="home" />
    <main style={{ flex: 1, padding: "40px 56px 56px", overflow: "hidden" }}>
      {/* slim masthead */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontFamily: "var(--mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.16, color: "var(--ink-3)", paddingBottom: 14, borderBottom: "1px solid var(--line-2)", marginBottom: 40 }}>
        <span>2024.11 · Issue 42</span>
        <span style={{ color: "var(--ink)", fontWeight: 600, letterSpacing: 0.2 }}>FRONTEND · CSS · DX</span>
        <span>Wed · 12°</span>
      </div>

      {/* cover story — airy, hairline-only */}
      <a style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 44, marginBottom: 56, textDecoration: "none", color: "inherit" }}>
        <div>
          <PMCover kind="blocks" ratio="5/3" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 18 }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: 0.22, color: "var(--blue-600)", fontWeight: 600 }}>Cover Story · 9 min</div>
          <h2 style={{ margin: 0, fontSize: 42, fontWeight: 700, letterSpacing: -0.7, lineHeight: 1.1 }}>왜 vanilla-extract으로<br/><span style={{ color: "var(--blue)" }}>옮겼는가</span></h2>
          <p style={{ margin: 0, color: "var(--ink-2)", lineHeight: 1.65, fontSize: 15 }}>런타임 CSS-in-JS는 편했지만, 모노레포의 빌드가 무거워질수록 초기 로드가 눈에 띄게 느려졌다.</p>
          <div style={{ fontSize: 11.5, color: "var(--ink-4)", fontFamily: "var(--mono)", letterSpacing: 0.12 }}>2024.11.02 · DX 재정비 01/04</div>
        </div>
      </a>

      {/* rest — light list with issue numbering */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {PMPosts.slice(1, 5).map((p, i) => (
          <a key={p.title} style={{ display: "grid", gridTemplateColumns: "40px 140px 1fr 120px", gap: 24, alignItems: "center", padding: "22px 0", borderTop: "1px solid var(--line-2)", textDecoration: "none", color: "inherit" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-4)", letterSpacing: 0.12 }}>№ {String(i+2).padStart(2,"0")}</div>
            <div style={{ aspectRatio: "4/3" }}><PMCover kind={p.cover} /></div>
            <div>
              <h3 style={{ margin: 0, fontSize: 19, fontWeight: 600, letterSpacing: -0.25, lineHeight: 1.25 }}>{p.title}</h3>
              <div style={{ marginTop: 6, display: "flex", gap: 8, alignItems: "center" }}>
                <PMChip>{p.tag}</PMChip>
                {p.series && <PMChip tone="blue">{p.series}</PMChip>}
              </div>
            </div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-4)", textAlign: "right", letterSpacing: 0.08 }}>{p.date}<br/>{p.min} min</div>
          </a>
        ))}
      </div>
    </main>
  </div>
);

// ─── Article ────────────────────────────────────────────────
const PMArticle = () => (
  <div style={{ display: "flex", height: "100%", background: "#fff", fontSize: 14 }}>
    <PMSidebar active="articles" />
    <main style={{ flex: 1, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "var(--line-2)", zIndex: 2 }}>
        <div style={{ width: "34%", height: "100%", background: "var(--blue)" }} />
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "64px 40px 120px" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: 0.22, color: "var(--blue-600)", fontWeight: 600, marginBottom: 18 }}>DX 재정비 · Chapter 1 of 4</div>
        <h1 style={{ margin: "0 0 16px", fontSize: 52, fontWeight: 700, letterSpacing: -1, lineHeight: 1.08 }}>
          왜 vanilla-extract으로 <span style={{ color: "var(--blue)" }}>옮겼는가</span>
        </h1>
        <p style={{ margin: "0 0 32px", fontSize: 19, color: "var(--ink-2)", lineHeight: 1.5, maxWidth: 620 }}>
          런타임 비용을 지불하지 않으면서, 타입 안전한 스타일을 유지하는 가장 간단한 방법에 대한 기록.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 12, color: "var(--ink-3)", fontFamily: "var(--mono)", paddingBottom: 28, borderBottom: "1px solid var(--line-2)", letterSpacing: 0.1 }}>
          <span>2024.11.02</span>·<span>9 MIN</span>·<span>3,201 WORDS</span>
          <span style={{ marginLeft: "auto", color: "var(--blue-600)" }}>◐ DARK · ⤴ SHARE</span>
        </div>

        <div style={{ fontSize: 17, lineHeight: 1.85, color: "var(--ink)", marginTop: 36 }}>
          <p style={{ margin: "0 0 22px" }}>
            <span style={{ float: "left", fontFamily: "var(--sans)", fontSize: 68, fontWeight: 700, lineHeight: 0.9, margin: "6px 10px 0 0", color: "var(--blue)", letterSpacing: -0.04 }}>처</span>
            음에는 Emotion으로 시작했다. 컴포넌트 옆에 스타일을 바로 쓸 수 있고, prop 기반 분기도 자연스러웠다. 그러다 앱이 커지고 모노레포에 패키지가 늘자, 번들의 스타일 런타임이 무거워지기 시작했다.
          </p>

          <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.4, margin: "44px 0 14px" }}>문제는 번들이 아니라 타이밍이었다</h2>
          <p style={{ margin: "0 0 22px" }}>
            실제 크기가 크진 않았다. 문제는 첫 paint 전에 JS가 파싱·실행돼야만 스타일이 붙는다는 점이었다. 느린 네트워크에서는 레이아웃이 두 번 흔들렸다.
          </p>

          {/* pullquote — magazine style but hairline only */}
          <div style={{ margin: "36px -8px", padding: "28px 0", borderTop: "1px solid var(--ink)", borderBottom: "1px solid var(--ink)", textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.4, lineHeight: 1.25, color: "var(--ink)" }}>
              "결국 타이밍이<br/><span style={{ color: "var(--blue)" }}>가장 비싼 리소스</span>다."
            </div>
            <div style={{ marginTop: 12, fontFamily: "var(--mono)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: 0.22, color: "var(--ink-4)" }}>— from the piece</div>
          </div>

          {/* callout — light */}
          <div style={{ margin: "28px 0", padding: "16px 20px", background: "var(--blue-50)", borderLeft: "2px solid var(--blue)", display: "flex", gap: 14 }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, fontWeight: 700, color: "var(--blue-600)", letterSpacing: 0.2, flexShrink: 0, paddingTop: 3 }}>NOTE · 01</div>
            <div style={{ fontSize: 14.5, color: "var(--ink-2)", lineHeight: 1.7 }}>
              TTI 300ms 개선이 목표였고, 실제로는 CLS 쪽에서 더 큰 이득을 봤다. 숫자보다 사용자가 "덜 흔들린다"고 느끼는 게 중요했다.
            </div>
          </div>

          {/* code block — clean paper style with blue tab underline */}
          <div style={{ margin: "28px 0", border: "1px solid var(--line)", borderRadius: 8, overflow: "hidden" }}>
            <div style={{ display: "flex", background: "#fafbfc", borderBottom: "1px solid var(--line-2)" }}>
              <div style={{ padding: "10px 16px", fontFamily: "var(--mono)", fontSize: 12, fontWeight: 600, color: "var(--ink)", background: "#fff", borderRight: "1px solid var(--line-2)", borderBottom: "2px solid var(--blue)", marginBottom: -1 }}>theme.css.ts</div>
              <div style={{ padding: "10px 16px", fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-4)" }}>Button.css.ts</div>
              <div style={{ marginLeft: "auto", padding: "8px 12px" }}>
                <button style={{ border: "1px solid var(--line)", background: "#fff", borderRadius: 5, padding: "4px 10px", fontSize: 11, color: "var(--ink-3)", cursor: "pointer", fontFamily: "var(--mono)", letterSpacing: 0.1 }}>COPY</button>
              </div>
            </div>
            <pre style={{ margin: 0, padding: "16px 18px", fontFamily: "var(--mono)", fontSize: 13, lineHeight: 1.75, background: "#fff", color: "var(--ink)", overflow: "hidden" }}>
<span style={{ color: "#6b7389" }}>// 3-tier tokens</span>{'\n'}
<span style={{ color: "#8a4bff" }}>export const</span> <span style={{ color: "var(--blue-600)" }}>colors</span> = <span style={{ color: "var(--blue-600)" }}>createGlobalTheme</span>(<span style={{ color: "#2a7f3f" }}>':root'</span>, {'{'}{'\n'}
{'  '}<span style={{ color: "var(--blue-600)" }}>surfaceCanvas</span>: gray[<span style={{ color: "#b4541f" }}>50</span>],{'\n'}
{'  '}<span style={{ color: "var(--blue-600)" }}>accentEmphasis</span>: blue[<span style={{ color: "#b4541f" }}>500</span>],{'\n'}
{'}'});
            </pre>
          </div>

          <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.4, margin: "44px 0 14px" }}>결과<sup style={{ color: "var(--blue)", fontSize: 13, fontWeight: 600 }}>1</sup></h2>
          <p style={{ margin: "0 0 22px" }}>스타일 런타임을 완전히 뺐다. 번들 크기보다도 렌더 타이밍이 안정적으로 좋아졌다는 게 체감으로 컸다.</p>
        </div>

        {/* footnotes */}
        <div style={{ marginTop: 52, paddingTop: 24, borderTop: "1px solid var(--line-2)", fontSize: 13, color: "var(--ink-3)", lineHeight: 1.7 }}>
          <div style={{ fontSize: 10.5, fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: 0.18, color: "var(--ink-4)", marginBottom: 10, fontWeight: 600 }}>Footnotes</div>
          <ol style={{ margin: 0, paddingLeft: 20 }}>
            <li>Lighthouse 12, moto g power 4G slow profile. 로컬 3회 평균.</li>
          </ol>
        </div>

        {/* next in series — airy */}
        <a style={{ marginTop: 40, padding: "26px 0", borderTop: "1px solid var(--ink)", display: "flex", justifyContent: "space-between", alignItems: "center", textDecoration: "none", color: "inherit" }}>
          <div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: 0.22, color: "var(--blue-600)", fontWeight: 700, marginBottom: 6 }}>Next · DX 재정비 02 / 04</div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.3 }}>Sprinkles로 반응형 스타일링을 정리하다</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4, fontFamily: "var(--mono)" }}>6 min · 2024.11.10</div>
          </div>
          <div style={{ fontSize: 28, color: "var(--blue)" }}>→</div>
        </a>
      </div>
    </main>
  </div>
);

// ─── Mobile ─────────────────────────────────────────────────
const PMMobile = () => (
  <PMPhone>
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100% - 44px)" }}>
      <div style={{ padding: "14px 22px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--line-2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <PMMark size={20} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>vallista-land</div>
            <div style={{ fontSize: 9, fontFamily: "var(--mono)", color: "var(--ink-4)", letterSpacing: 0.18, textTransform: "uppercase" }}>Issue 42 · 2024.11</div>
          </div>
        </div>
        <button style={{ border: "none", background: "transparent", fontSize: 22, cursor: "pointer" }}>×</button>
      </div>

      <div style={{ padding: "18px 22px 10px" }}>
        <div style={{ position: "relative" }}>
          <input placeholder="글 검색…" style={{ width: "100%", padding: "12px 14px 12px 40px", border: "1px solid var(--line)", borderRadius: 10, fontSize: 15, boxSizing: "border-box", fontFamily: "inherit", color: "var(--ink)" }} />
          <svg style={{ position: "absolute", top: 14, left: 14 }} width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--ink-4)" strokeWidth="1.4"><circle cx="6" cy="6" r="4.5"/><path d="M9.5 9.5L13 13"/></svg>
        </div>
      </div>

      <nav style={{ padding: "6px 22px 0", display: "flex", flexDirection: "column" }}>
        {PMNav.map((n, i) => (
          <a key={n.k} style={{
            display: "flex", justifyContent: "space-between", alignItems: "baseline",
            padding: "14px 0", borderBottom: "1px solid var(--line-2)",
            textDecoration: "none", color: "var(--ink)",
          }}>
            <span style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-4)" }}>{String(i+1).padStart(2,"0")}</span>
              <span style={{ fontSize: 20, fontWeight: 600, letterSpacing: -0.3 }}>{n.label}</span>
            </span>
            {n.count != null && <span style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--ink-4)" }}>{n.count}</span>}
          </a>
        ))}
      </nav>

      <div style={{ padding: "20px 22px 0" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.2, color: "var(--ink-4)", marginBottom: 10, fontWeight: 600 }}>Series</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {PMSeries.map(s => (
            <div key={s.k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
              <span style={{ fontSize: 14, color: "var(--ink-2)" }}>{s.label}</span>
              <span style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--ink-4)" }}>{String(s.count).padStart(2,"0")}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: "auto", padding: "16px 22px", borderTop: "1px solid var(--line-2)", display: "flex", justifyContent: "space-between", fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", color: "var(--ink-4)", letterSpacing: 0.18 }}>
        <span>RSS · GH · @</span>
        <span>◐ Dark</span>
      </div>
    </div>
  </PMPhone>
);

Object.assign(window, { PMHome, PMArticle, PMMobile });
