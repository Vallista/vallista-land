// Variant B — Docs style (Vercel/Linear 풍)
// 사이드바가 문서 네비 · 시리즈/태그 접이식 · 본문 중앙 한 컬럼

const DocsSidebar = ({ active = "home" }) => (
  <aside style={{ width: 240, padding: "28px 20px", borderRight: "1px solid var(--line-2)", background: "var(--bg-soft)", display: "flex", flexDirection: "column", gap: 22, height: "100%", boxSizing: "border-box", overflow: "hidden" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 6px" }}>
      <Mark size={22} />
      <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: -0.1 }}>vallista-land</div>
      <span style={{ marginLeft: "auto", fontSize: 10, fontFamily: "var(--mono)", color: "var(--ink-4)", padding: "2px 5px", border: "1px solid var(--line)", borderRadius: 3 }}>v2</span>
    </div>
    <div style={{ position: "relative" }}>
      <input readOnly placeholder="Search..." style={{ width: "100%", padding: "7px 10px 7px 30px", border: "1px solid var(--line)", borderRadius: 7, fontSize: 12.5, boxSizing: "border-box", fontFamily: "inherit", color: "var(--ink-3)", background: "#fff" }} />
      <svg style={{ position: "absolute", top: 8, left: 10 }} width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="var(--ink-4)" strokeWidth="1.4"><circle cx="6" cy="6" r="4.5"/><path d="M9.5 9.5L13 13"/></svg>
      <span style={{ position: "absolute", top: 7, right: 8, fontSize: 10, fontFamily: "var(--mono)", color: "var(--ink-4)", padding: "1px 5px", border: "1px solid var(--line)", borderRadius: 3, background: "#fff" }}>⌘K</span>
    </div>

    {/* group: Browse */}
    <Group title="Browse">
      {NAV.map(n => (
        <SideItem key={n.k} active={active === n.k}>
          {n.label}
          {n.count != null && <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--ink-4)", fontFamily: "var(--mono)" }}>{n.count}</span>}
        </SideItem>
      ))}
    </Group>

    {/* group: Series - expandable */}
    <Group title="Series" collapsible>
      {SERIES.map((s, i) => (
        <SideItem key={s.k} indent>
          <span style={{ color: "var(--ink-4)", marginRight: 6, fontSize: 10 }}>▾</span>{s.label}
          <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--ink-4)", fontFamily: "var(--mono)" }}>{s.count}</span>
        </SideItem>
      ))}
    </Group>

    {/* group: Tags */}
    <Group title="Tags">
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, padding: "0 6px" }}>
        {TAGS.map(t => <span key={t} style={{ fontSize: 11, padding: "2px 7px", borderRadius: 4, background: "#fff", border: "1px solid var(--line-2)", color: "var(--ink-2)" }}>{t}</span>)}
      </div>
    </Group>

    <div style={{ marginTop: "auto", padding: "10px 6px 0", fontSize: 11, color: "var(--ink-4)", fontFamily: "var(--mono)", display: "flex", gap: 10 }}>
      <span>RSS</span><span>GH</span><span>@</span>
      <span style={{ marginLeft: "auto" }}>◐</span>
    </div>
  </aside>
);

const Group = ({ title, children, collapsible }) => (
  <div>
    <div style={{ padding: "0 10px", marginBottom: 6, fontSize: 10.5, fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: 0.16, color: "var(--ink-4)", display: "flex", alignItems: "center", gap: 6 }}>
      {collapsible && <span style={{ fontSize: 9 }}>▾</span>}{title}
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>{children}</div>
  </div>
);

const SideItem = ({ active, indent, children }) => (
  <a style={{
    display: "flex", alignItems: "center",
    padding: `5px ${indent ? 18 : 10}px`, borderRadius: 5, textDecoration: "none",
    color: active ? "var(--blue-600)" : "var(--ink-2)",
    background: active ? "var(--blue-50)" : "transparent",
    fontSize: 13, fontWeight: active ? 600 : 500,
  }}>{children}</a>
);

const DocsHome = () => (
  <div style={{ display: "flex", height: "100%", background: "#fff", fontSize: 14 }}>
    <DocsSidebar active="home" />
    <main style={{ flex: 1, padding: "40px 56px 56px", overflow: "hidden" }}>
      <div style={{ maxWidth: 840, margin: "0 auto" }}>
        <div style={{ fontSize: 11, fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: 0.16, color: "var(--ink-4)", marginBottom: 10 }}>Index</div>
        <h1 style={{ margin: "0 0 10px", fontSize: 36, fontWeight: 700, letterSpacing: -0.6 }}>프론트엔드를 기록한다.</h1>
        <p style={{ margin: "0 0 36px", color: "var(--ink-2)", fontSize: 16, lineHeight: 1.6, maxWidth: 560 }}>
          <span style={{ color: "var(--blue)" }}>@vallista</span>의 프론트엔드 기술 블로그. 글 42 · 메모 28 · 프로젝트 6개.
        </p>

        {/* Latest row */}
        <SectionHead title="Latest" meta="최근 6" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18, marginBottom: 44 }}>
          {SAMPLE_POSTS.slice(0, 3).map(p => (
            <a key={p.title} style={{ display: "flex", flexDirection: "column", gap: 10, textDecoration: "none", color: "inherit", padding: 12, borderRadius: 10, border: "1px solid var(--line-2)" }}>
              <div style={{ aspectRatio: "16/10", borderRadius: 5, overflow: "hidden" }}><Cover kind={p.cover} /></div>
              <div style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--ink-4)" }}>{p.date} · {p.min} min</div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, letterSpacing: -0.15, lineHeight: 1.35 }}>{p.title}</h3>
              <div style={{ display: "flex", gap: 5 }}>
                <Chip>{p.tag}</Chip>
                {p.series && <Chip tone="blue">{p.series}</Chip>}
              </div>
            </a>
          ))}
        </div>

        {/* Series focus */}
        <SectionHead title="Series" meta="연재 중" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 44 }}>
          {SERIES.map(s => (
            <a key={s.k} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", border: "1px solid var(--line-2)", borderRadius: 10, textDecoration: "none", color: "inherit" }}>
              <div style={{ width: 36, height: 36, borderRadius: 7, background: "var(--blue-50)", color: "var(--blue-600)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, fontFamily: "var(--mono)" }}>{s.count}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{s.label}</div>
                <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{s.count}개의 글 · 진행 중</div>
              </div>
              <span style={{ color: "var(--blue)", fontSize: 18 }}>→</span>
            </a>
          ))}
        </div>

        {/* Notes */}
        <SectionHead title="Notes" meta="최근 생각" />
        <div style={{ display: "flex", flexDirection: "column", border: "1px solid var(--line-2)", borderRadius: 10, overflow: "hidden" }}>
          {NOTES.map((n, i) => (
            <a key={i} style={{ display: "grid", gridTemplateColumns: "60px 1fr", gap: 14, padding: "14px 18px", borderBottom: i < NOTES.length - 1 ? "1px solid var(--line-2)" : "none", textDecoration: "none", color: "inherit", alignItems: "start" }}>
              <div style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--ink-4)", paddingTop: 2 }}>{n.date}</div>
              <div style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.6 }}>{n.text}</div>
            </a>
          ))}
        </div>
      </div>
    </main>
  </div>
);

const SectionHead = ({ title, meta }) => (
  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: -0.25 }}>{title}</h2>
    <span style={{ fontSize: 12, color: "var(--ink-4)", fontFamily: "var(--mono)" }}>{meta}</span>
  </div>
);

// ─── Article ────────────────────────────────────────────────
const DocsArticle = () => (
  <div style={{ display: "flex", height: "100%", background: "#fff", fontSize: 14 }}>
    <DocsSidebar active="articles" />
    <main style={{ flex: 1, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "var(--line-2)", zIndex: 2 }}>
        <div style={{ width: "34%", height: "100%", background: "var(--blue)" }} />
      </div>

      {/* breadcrumbs */}
      <div style={{ position: "sticky", top: 0, padding: "14px 40px", background: "rgba(255,255,255,.9)", backdropFilter: "blur(8px)", borderBottom: "1px solid var(--line-2)", fontSize: 12, color: "var(--ink-3)", fontFamily: "var(--mono)", display: "flex", gap: 8 }}>
        <span>Articles</span><span>›</span><span>DX 재정비</span><span>›</span><span style={{ color: "var(--ink)" }}>vanilla-extract</span>
        <span style={{ marginLeft: "auto", color: "var(--blue-600)" }}>Edit on GitHub ↗</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 40, maxWidth: 960, margin: "0 auto", padding: "48px 40px 120px" }}>
        <article>
          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            <Chip tone="blue">DX 재정비 · 1/4</Chip>
            <Chip>CSS</Chip>
            <Chip>monorepo</Chip>
          </div>
          <h1 style={{ margin: "0 0 12px", fontSize: 40, fontWeight: 700, letterSpacing: -0.8, lineHeight: 1.2 }}>왜 vanilla-extract으로 옮겼는가</h1>
          <p style={{ margin: "0 0 20px", fontSize: 16.5, color: "var(--ink-2)", lineHeight: 1.55 }}>런타임 비용을 지불하지 않으면서, 타입 안전한 스타일을 유지하는 가장 간단한 방법.</p>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12.5, color: "var(--ink-3)", fontFamily: "var(--mono)", paddingBottom: 24, borderBottom: "1px solid var(--line-2)" }}>
            <span>2024.11.02</span>·<span>9 min</span>·<span>3,201 words</span>
            <span style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
              <span>🌙 Dark</span><span>🔗 Share</span>
            </span>
          </div>

          <div style={{ fontSize: 16, lineHeight: 1.8, color: "var(--ink)", marginTop: 30 }}>
            <p style={{ margin: "0 0 20px" }}>
              처음에는 <a style={{ color: "var(--blue)", textDecoration: "none", fontWeight: 500 }}>Emotion</a>으로 시작했다. 컴포넌트 옆에 스타일을 바로 쓸 수 있고, prop 기반 분기도 자연스러웠다.
            </p>
            <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.3, margin: "36px 0 12px", scrollMarginTop: 80 }}>문제는 번들이 아니라 타이밍이었다</h2>
            <p style={{ margin: "0 0 20px" }}>
              실제 크기가 크진 않았다. 문제는 첫 paint 전에 JS가 파싱·실행돼야만 <strong style={{ color: "var(--blue-600)", fontWeight: 600 }}>스타일이 붙는다</strong>는 점이었다.
            </p>

            {/* callout docs style */}
            <div style={{ margin: "24px 0", padding: "14px 16px", background: "var(--blue-50)", border: "1px solid #d6e3ff", borderRadius: 8, display: "flex", gap: 12 }}>
              <div style={{ color: "var(--blue)", fontSize: 16, flexShrink: 0 }}>ⓘ</div>
              <div style={{ fontSize: 14.5, color: "var(--ink-2)", lineHeight: 1.65 }}>
                <strong style={{ color: "var(--blue-600)", display: "block", marginBottom: 2 }}>Note</strong>
                TTI 300ms 개선이 목표였고, 실제로는 CLS 쪽에서 더 큰 이득을 봤다.
              </div>
            </div>

            {/* code block with filename tabs + line numbers */}
            <div style={{ margin: "24px 0", borderRadius: 8, overflow: "hidden", border: "1px solid var(--line)" }}>
              <div style={{ display: "flex", background: "#f6f7fb", borderBottom: "1px solid var(--line-2)" }}>
                <TabTop active>theme.css.ts</TabTop>
                <TabTop>Button.css.ts</TabTop>
                <div style={{ marginLeft: "auto", padding: "6px 10px", display: "flex", gap: 4 }}>
                  <IconBtn>⧉</IconBtn>
                </div>
              </div>
              <pre style={{ margin: 0, padding: "14px 0", fontFamily: "var(--mono)", fontSize: 12.5, lineHeight: 1.75, background: "#fbfbfd", display: "grid", gridTemplateColumns: "auto 1fr" }}>
                <div style={{ color: "#c4c8d4", textAlign: "right", paddingRight: 14, paddingLeft: 14, userSelect: "none", borderRight: "1px solid var(--line-2)" }}>
                  {[1,2,3,4,5,6].map(n => <div key={n}>{n}</div>)}
                </div>
                <div style={{ paddingLeft: 14, color: "var(--ink)", overflow: "hidden" }}>
<div><span style={{ color: "#6b7389" }}>// 3-tier tokens</span></div>
<div><span style={{ color: "#8a4bff" }}>export const</span> <span style={{ color: "var(--blue-600)" }}>colors</span> = <span style={{ color: "var(--blue-600)" }}>createGlobalTheme</span>(<span style={{ color: "#2a7f3f" }}>':root'</span>, {'{'}</div>
<div>{'  '}<span style={{ color: "var(--blue-600)" }}>surfaceCanvas</span>: gray[<span style={{ color: "#b4541f" }}>50</span>],</div>
<div>{'  '}<span style={{ color: "var(--blue-600)" }}>textPrimary</span>:   gray[<span style={{ color: "#b4541f" }}>900</span>],</div>
<div>{'  '}<span style={{ color: "var(--blue-600)" }}>accentEmphasis</span>: blue[<span style={{ color: "#b4541f" }}>500</span>],</div>
<div>{'}'});</div>
                </div>
              </pre>
            </div>

            <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.3, margin: "36px 0 12px" }}>결과<sup style={{ color: "var(--blue)", fontSize: 12, fontWeight: 600 }}>1</sup></h2>
            <p style={{ margin: "0 0 20px" }}>스타일 런타임을 완전히 뺐다. 번들 크기보다도 렌더 타이밍이 안정적으로 좋아졌다.</p>

            <blockquote style={{ margin: "28px 0", padding: "0 0 0 18px", borderLeft: "3px solid var(--ink)", color: "var(--ink-2)", fontSize: 17, fontStyle: "normal", fontWeight: 500, lineHeight: 1.55 }}>
              "결국 타이밍이 가장 비싼 리소스다."
            </blockquote>
          </div>

          {/* footnotes */}
          <div style={{ marginTop: 44, padding: "18px 0", borderTop: "1px solid var(--line-2)", fontSize: 12.5, color: "var(--ink-3)", lineHeight: 1.7 }}>
            <div style={{ fontSize: 11, fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: 0.14, color: "var(--ink-4)", marginBottom: 8 }}>Footnotes</div>
            <ol style={{ margin: 0, paddingLeft: 18 }}>
              <li>Lighthouse 12, moto g power 4G slow. 로컬 3회 평균. <a style={{ color: "var(--blue)" }}>↩︎</a></li>
            </ol>
          </div>

          {/* next */}
          <div style={{ marginTop: 36, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <NextCard dir="prev" series="DX 재정비" title="모노레포 구조 결정기" />
            <NextCard dir="next" series="DX 재정비" title="Sprinkles로 반응형 스타일링을 정리하다" />
          </div>
        </article>

        {/* TOC docs style */}
        <aside style={{ position: "sticky", top: 60, alignSelf: "start", fontSize: 12.5 }}>
          <div style={{ fontSize: 11, fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: 0.14, color: "var(--ink-4)", marginBottom: 12 }}>On this page</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <TocItem>시작점</TocItem>
            <TocItem active>문제는 번들이 아니라 타이밍</TocItem>
            <TocItem indent>측정 결과</TocItem>
            <TocItem indent>CLS 변화</TocItem>
            <TocItem>대안 비교</TocItem>
            <TocItem>결과</TocItem>
          </div>
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--line-2)", display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
            <a style={{ color: "var(--ink-3)", textDecoration: "none" }}>Edit on GitHub ↗</a>
            <a style={{ color: "var(--ink-3)", textDecoration: "none" }}>Scroll to top ↑</a>
          </div>
        </aside>
      </div>
    </main>
  </div>
);

const TabTop = ({ children, active }) => (
  <div style={{ padding: "9px 16px", fontFamily: "var(--mono)", fontSize: 12, color: active ? "var(--ink)" : "var(--ink-3)", background: active ? "#fbfbfd" : "transparent", borderRight: "1px solid var(--line-2)", borderBottom: active ? "1.5px solid var(--blue)" : "none", fontWeight: active ? 600 : 400 }}>{children}</div>
);
const IconBtn = ({ children }) => (
  <button style={{ border: "1px solid var(--line)", background: "#fff", borderRadius: 5, padding: "3px 8px", fontSize: 12, color: "var(--ink-3)", cursor: "pointer", fontFamily: "var(--mono)" }}>{children}</button>
);
const TocItem = ({ active, indent, children }) => (
  <a style={{ paddingLeft: indent ? 12 : 0, color: active ? "var(--blue)" : "var(--ink-3)", fontWeight: active ? 600 : 500, textDecoration: "none", fontSize: indent ? 11.5 : 12.5 }}>{children}</a>
);
const NextCard = ({ dir, series, title }) => (
  <a style={{ display: "flex", flexDirection: "column", gap: 4, padding: "14px 16px", border: "1px solid var(--line-2)", borderRadius: 8, textDecoration: "none", color: "inherit", textAlign: dir === "prev" ? "left" : "right" }}>
    <div style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--ink-4)" }}>{dir === "prev" ? "← Previous" : "Next →"} · {series}</div>
    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--blue-600)" }}>{title}</div>
  </a>
);

// ─── Mobile ─────────────────────────────────────────────────
const DocsMobile = () => (
  <Phone bg="var(--bg-soft)">
    <div style={{ padding: "0 18px", display: "flex", flexDirection: "column", height: "calc(100% - 44px)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Mark size={20} />
          <div style={{ fontSize: 14, fontWeight: 700 }}>vallista-land</div>
          <span style={{ fontSize: 9, fontFamily: "var(--mono)", color: "var(--ink-4)", padding: "2px 5px", border: "1px solid var(--line)", borderRadius: 3 }}>v2</span>
        </div>
        <button style={{ border: "none", background: "transparent", fontSize: 22, color: "var(--ink)", cursor: "pointer" }}>×</button>
      </div>
      <div style={{ position: "relative", marginBottom: 22 }}>
        <input placeholder="Search docs..." style={{ width: "100%", padding: "12px 14px 12px 38px", border: "1px solid var(--line)", borderRadius: 8, fontSize: 14, boxSizing: "border-box", background: "#fff", fontFamily: "inherit", color: "var(--ink)" }} />
        <svg style={{ position: "absolute", top: 14, left: 14 }} width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--ink-4)" strokeWidth="1.4"><circle cx="6" cy="6" r="4.5"/><path d="M9.5 9.5L13 13"/></svg>
      </div>

      <div style={{ fontSize: 10, fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: 0.16, color: "var(--ink-4)", marginBottom: 8, padding: "0 4px" }}>Browse</div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 18 }}>
        {NAV.map(n => (
          <a key={n.k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 12px", borderRadius: 7, textDecoration: "none", color: "var(--ink)", fontSize: 15, fontWeight: 500, background: n.k === "home" ? "#fff" : "transparent", border: n.k === "home" ? "1px solid var(--line-2)" : "1px solid transparent" }}>
            <span>{n.label}</span>
            {n.count != null && <span style={{ fontSize: 11, color: "var(--ink-4)", fontFamily: "var(--mono)" }}>{n.count}</span>}
          </a>
        ))}
      </nav>

      <div style={{ fontSize: 10, fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: 0.16, color: "var(--ink-4)", marginBottom: 8, padding: "0 4px" }}>Series</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 18 }}>
        {SERIES.map(s => (
          <a key={s.k} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 7, background: "#fff", border: "1px solid var(--line-2)" }}>
            <div style={{ width: 26, height: 26, borderRadius: 5, background: "var(--blue-50)", color: "var(--blue-600)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, fontFamily: "var(--mono)" }}>{s.count}</div>
            <span style={{ fontSize: 14, fontWeight: 500 }}>{s.label}</span>
          </a>
        ))}
      </div>

      <div style={{ marginTop: "auto", padding: "12px 4px", fontSize: 11, fontFamily: "var(--mono)", color: "var(--ink-4)", display: "flex", gap: 14 }}>
        <span>RSS</span><span>GitHub</span><span>Email</span>
        <span style={{ marginLeft: "auto" }}>◐ Dark</span>
      </div>
    </div>
  </Phone>
);

Object.assign(window, { DocsHome, DocsArticle, DocsMobile });
