# Handoff: vallista-land 블로그 구현

> 이 패키지는 **디자인 참조 + 기존 스펙 문서**로 구성된 구현 지시서입니다.
> `docs/`가 이미 source of truth로 존재하므로, 이 README는 "무엇을 어떤 순서로 만들지"만 얇게 덧붙입니다.

---

## 1. 전체 그림

- **목표**: `blog/` 폴더의 HTML 디자인 참조를, `docs/`에 정의된 토큰·컴포넌트 스펙·스택 그대로 Astro 프로젝트로 옮기는 것.
- **이미 정해진 것 (재논의 금지)**:
  - 스택: Astro + vanilla-extract + Pagefind + MDX (`docs/01-stack.md`)
  - 토큰: `docs/tokens.json` + `docs/theme.css.ts` (유일한 소스)
  - 규칙: `CLAUDE.md`의 Hard rules 1~10 — 그 중 특히
    1. 토큰 외 raw hex/px 금지
    2. 클라이언트 JS는 `Palette.tsx` 제외 전부 정당화 필요
    3. 아이콘/UI 라이브러리 금지, 인라인 SVG만
    4. accent 단일 (blue)
    5. 한글 타이포: `word-break: keep-all`, `text-wrap: pretty`
- **이 핸드오프가 추가하는 것**: `blog/` HTML을 그 규칙 위에 얹기 위한 매핑 표 + 구현 순서.

---

## 2. 디자인 파일에 대해

`handoff/design-references/` 안의 HTML들은 **프로덕션 코드가 아니라 디자인 참조**입니다.
인라인 `<style>`, CSS 변수, placeholder SVG 등은 "의도된 픽셀을 보여주기 위한 장치"일 뿐이고,
실제 구현은 반드시 아래를 거쳐야 합니다:

- 색·간격·radius·elevation·duration → **`docs/tokens.json` / `theme.css.ts`의 semantic token**
- 레이아웃 컴포넌트 → **`docs/04-components/*.md`의 primitive**
- 페이지 구조 → **`docs/05-blog-spec.md § Routes`**

디자인 참조가 docs와 충돌하면 **docs가 API를, 참조가 비주얼을 이깁니다** (CLAUDE.md 9번 규칙).

## 3. 피델리티

**High-fidelity.** 세 HTML 모두 최종 색·타이포·간격·상호작용까지 확정된 mock입니다.
픽셀 단위로 맞추되, **raw 값이 아니라 semantic token을 거쳐** 맞춰야 합니다.

예: 참조 HTML에 `#2b6cff`가 있더라도 → `vars.color.accent` (또는 그 상위 semantic alias)로 매핑.
토큰에 없는 값이면 새 토큰을 추가해서 쓰고, 컴포넌트에 raw로 박지 않습니다.

---

## 4. 디자인 참조 파일

| 파일 | 대응 라우트 (per `docs/05-blog-spec.md`) | 용도 |
|---|---|---|
| `design-references/Blog A.html` | `/` (홈 · 최신 아티클 리스트) + `/articles/[slug]` (상세) | 메인 시각 타겟 |
| `design-references/Blog Variants.html` | — | 홈 레이아웃 대안 탐색 (3가지 variant). 최종 채택: **Variant A (Paper A)** |
| `design-references/Resume & About.html` | `/resume`, `/about` | 2개 섹션 토글 UI로 묶인 한 페이지. 실제 구현도 한 페이지(`/about`) + 섹션 앵커 권장 |

> `Blog Variants.html`은 탐색용 자료. 최종 채택본은 `Blog A.html`이며, 여기에만 맞춰 구현.

---

## 5. 구현 순서 (권장)

`docs/00-README.md`의 순서를 따르되, 이 디자인 기준으로 구체화:

### Phase 0 — 기반 (0.5일)
1. `pnpm create astro@latest` → `src/styles/theme.css.ts`에 `docs/theme.css.ts` 붙여넣기
2. Pretendard + JetBrains Mono 로컬 호스팅 (`docs/03-typography.md`)
3. 글로벌 스타일: `word-break: keep-all`, `prefers-reduced-motion` 처리 (`docs/07-motion.md`)
4. `pnpm check` 통과 확인

### Phase 1 — Primitives (1~2일)
`docs/04-components/`의 스펙대로 다음을 `src/components/ui/` 에 구현:
- `Button`, `Chip`, `Card`, `Callout`, `CodeBlock`, `Cover`, `Input`, `NavRail`, `Toc`

각 컴포넌트의 **시각적 타겟**은 `Blog A.html` / `Resume & About.html`에서 해당 요소를 찾아 확인.
(예: Chip의 `data-tone="blue"`, `dot` variant 등은 `Resume & About.html`의 Career 섹션에 전부 나옴)

### Phase 2 — 블로그 레이아웃 (1일)
- `src/layouts/BlogLayout.astro` — `Blog A.html`의 좌측 NavRail + 메인 컨텐츠 2열 구조
- `src/pages/index.astro` — 아티클 카드 리스트
- `src/pages/articles/[slug].astro` — MDX 렌더, TOC, Cover

### Phase 3 — About / Resume (0.5일)
- `src/pages/about.astro` — `Resume & About.html`의 About 섹션
- `src/pages/resume.astro` — Resume 섹션 (또는 `/about#resume` 앵커)
- 이 페이지의 **패널 토글 / Tweaks UI는 HTML 프로토타입 전용 장치**. 실제 빌드에는 포함 안 함.

### Phase 4 — Search (0.5일)
- Pagefind 빌드 붙이기 (`pnpm build && pagefind --site dist`)
- `src/components/search/Palette.tsx` — 유일하게 허용된 client island (`client:idle`)
- ⌘K 단축키, 결과 하이라이트

### Phase 5 — DoD (`docs/08-definition-of-done.md`)
- Lighthouse ≥ 95
- WCAG 2.1 AA
- 다크모드 auto + manual 둘 다
- `prefers-reduced-motion` 준수
- `pnpm check` 클린

---

## 6. 디자인 참조 → docs 매핑 체크리스트

구현 중 이 표를 옆에 두세요.

| 참조 HTML에서 본 것 | 실제 쓸 것 |
|---|---|
| 인라인 `#2b6cff` (accent blue) | `vars.color.accent` |
| 인라인 `#0b0d12` 류의 ink | `vars.color.ink` / `vars.color.text` |
| `--ink-2`, `--muted` 등 커스텀 변수 | `docs/tokens.json`의 대응 semantic token |
| `20px`, `24px` 등의 raw spacing | `vars.space.*` |
| `border-radius: 12px` | `vars.radius.*` |
| `transition: .2s ease` | `vars.duration.*` + `vars.easing.*` |
| `<svg>` 인라인 아이콘 (1.4 stroke, 16px) | 그대로 복사 (CLAUDE.md 3번) |
| 카드/버튼의 `box-shadow` | `vars.elevation.*` |
| `:focus` | `:focus-visible` + `box-shadow: vars.focusRing` |

**토큰에 없으면 추가**합니다. 컴포넌트에 raw 값 박는 건 리뷰 리젝 사유(CLAUDE.md 1번).

---

## 7. 한글 타이포 (놓치기 쉬움)

`Blog A.html`, `Resume & About.html` 둘 다 한글 본문이 많습니다. CLAUDE.md 5번 규칙 그대로:

```css
:root body {
  word-break: keep-all;     /* 필수 */
  text-wrap: pretty;         /* 지원 브라우저에서 */
}
/* 절대 쓰지 말 것 */
/* word-break: break-all;  */
/* text-align: justify;     */
```

Resume 페이지의 Career 타이틀이 `한글 직함 · English Title` 패턴으로 통일돼 있는데,
이 `·`(middle dot) 앞뒤 공백이 keep-all 상태에서 자연스럽게 줄바꿈되도록 확인할 것.

---

## 8. 스코프 밖 (건드리지 말 것)

`CLAUDE.md § Out of scope` 그대로:

- 댓글, 반응, 조회수, analytics, i18n, admin/editor UI, 이미지 파이프라인, 멀티컬러 테마

디자인 참조에 이런 요소가 보여도 무시합니다.
(예: `Blog A.html`의 구독 폼은 시각 요소일 뿐 — `docs/05-blog-spec.md § Routes`에 없으면 만들지 않음)

---

## 9. 구현 후 확인

```sh
pnpm check          # 무조건 통과
pnpm build          # Astro + Pagefind
pnpm lighthouse     # ≥ 95
pnpm test:e2e       # 스모크
```

DoD 전체 체크리스트: `docs/08-definition-of-done.md`.

---

## 10. 파일 인덱스

```
handoff/
├── README.md                         ← 지금 이 문서
└── design-references/
    ├── Blog A.html                   ← 홈 + 아티클 상세 비주얼 타겟
    ├── Blog Variants.html            ← 탐색 과정 (참고만)
    └── Resume & About.html           ← /about, /resume 비주얼 타겟

docs/                                 ← source of truth, 패키지에 포함 안 함
├── 00-README.md                      ← 반드시 먼저 읽기
├── 01-stack.md
├── 02-tokens.md
├── 03-typography.md
├── 04-components/                    ← 각 primitive 스펙
├── 05-blog-spec.md                   ← 라우트 정의
├── 06-a11y.md
├── 07-motion.md
├── 08-definition-of-done.md
├── theme.css.ts                      ← src/styles/ 에 그대로 복사
└── tokens.json

CLAUDE.md                             ← Hard rules 1~10
```
