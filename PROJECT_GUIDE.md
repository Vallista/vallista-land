# Vallista Land — 프로젝트 이해 가이드

이 문서는 레포에 처음 들어오는 사람(또는 새 세션의 Claude)이 **5분 안에 전체 그림을 잡을 수 있도록** 작성한 가이드입니다. `README.md`가 설치/실행 위주라면, 이 문서는 **구조/책임/워크플로우** 위주입니다.

---

## 1. 한 줄 요약

`vallista-land`는 **Vallista 개인 기술 블로그(`https://vallista.github.io`)를 운영하기 위한 pnpm 모노레포**입니다. 블로그 서비스와 재사용 가능한 디자인 시스템, Vite MDX 플러그인이 한 레포에 공존합니다.

---

## 2. 모노레포 레이아웃

```
vallista-land/
├── contents/                  # 블로그 마크다운 원본 (글/노트/프로젝트)
│   ├── articles/              # 기술 글·회고 (.md 또는 폴더 + index.md)
│   ├── notes/
│   └── projects/
│
├── services/                  # 실제로 배포되는 애플리케이션
│   ├── new-blog/              # ✅ 현재 운영 중인 블로그 (React 19 + Vite)
│   ├── blog/                  # 구 Gatsby 블로그 (legacy, 참고용)
│   └── design-system-test/    # DS 동작 확인용 샌드박스
│
├── packages/                  # 레포 내부 공유 라이브러리
│   ├── design-system/         # @vallista/design-system (Vanilla Extract)
│   └── vite-plugin-mdx/       # @vallista/vite-plugin-mdx (MDX 로더)
│
├── pnpm-workspace.yaml        # 워크스페이스 정의
├── package.json               # 루트 스크립트 (앱별 proxy)
├── README.md                  # 설치·실행 매뉴얼
└── PROJECT_GUIDE.md           # (이 문서)
```

### 어디를 만져야 하나 — 작업별 위치

| 하고 싶은 일 | 손대야 할 위치 |
|---|---|
| 새 글 작성 / 기존 글 수정 | `contents/articles/<slug>/index.md` 또는 `contents/articles/<slug>.md` |
| 블로그 UI/페이지 변경 | `services/new-blog/src/` |
| 공용 버튼·Tag 등 컴포넌트 | `packages/design-system/src/` |
| 마크다운 처리 로직 | `services/new-blog/scripts/generate-content.js` 또는 `packages/vite-plugin-mdx/` |
| 배포 파이프라인 | `services/new-blog/scripts/deploy.js`, 루트 `package.json`의 `deploy:new-blog` |

> **주의**: `services/blog`는 Gatsby 기반 **구 버전**입니다. 신규 기능은 모두 `services/new-blog`에 넣습니다.

---

## 3. 현재 운영 블로그 — `services/new-blog`

### 3-1. 기술 스택

- **React 19.1** + **TypeScript 5.7** + **Vite 6**
- **라우팅**: `react-router-dom v7` (BrowserRouter, CSR)
- **서버 상태**: `@tanstack/react-query v5` (staleTime 5분, retry 1)
- **클라이언트 상태**: `zustand`, React Context (Sidebar/Nav/Search)
- **스타일링**: `@vanilla-extract/css` (타입 안전 CSS-in-JS) + `@vallista/design-system`
- **메타 태그/SEO**: `react-helmet-async`
- **마크다운**: `react-markdown` + `remark-gfm` + `rehype-raw` + `rehype-sanitize` + `react-syntax-highlighter`
- **댓글**: Giscus (GitHub Discussions 기반)
- **테스트**: Vitest
- **배포**: `gh-pages` → `Vallista/vallista.github.io` 레포의 `main` 브랜치

### 3-2. FSD(Feature-Sliced Design) 폴더 구조

```
src/
├── app/         # 앱 진입점 — App.tsx, providers/, ErrorBoundary
├── pages/       # 라우트 단위 — home, article, about, resume
├── widgets/     # 복합 UI 블록 — article-card, article-header, series
├── features/    # 기능 단위 — comments (Giscus)
└── shared/      # 횡단 관심사
    ├── ui/      # Header, NavBar, Sidebar, MarkdownRenderer, TagCloud ...
    ├── hooks/   # useLocalStorage, useDebounce, useWindowSize, useThemeSwitch
    ├── context/ # Sidebar/Nav/Search Context
    ├── lib/     # content.ts (콘텐츠 로딩), utils.ts
    ├── api/, config/, constants/, types/, assets/, styles/
```

**Path alias** (vite.config.ts + tsconfig):
`@/`, `@app/*`, `@pages/*`, `@widgets/*`, `@features/*`, `@shared/*`, `@entities/*`, `@configs`

### 3-3. 라우팅 맵 (`src/app/App.tsx`)

| path | page |
|---|---|
| `/`, `/articles` | HomePage |
| `/articles/:slug` | ArticlePage |
| `/notes`, `/notes/:slug` | HomePage / ArticlePage |
| `/projects`, `/projects/:slug` | HomePage / ArticlePage |
| `/resume` | ResumePage |

SEO 이슈로 `main.tsx`에서 `/contents/articles/:slug` → `/articles/:slug` **클라이언트 리다이렉트**가 걸려 있습니다 (구글 색인 정리용).

### 3-4. 콘텐츠 파이프라인

```
contents/**/*.md
      │
      │  scripts/generate-content.js   ← build/dev 시 자동 실행
      ▼
public/contents/*.json  +  public/content-index.json
      │
      ▼
src/shared/lib/content.ts 가 로드 → React Query 캐시
```

- **글 작성 규약**: frontmatter 필수
  ```markdown
  ---
  title: 글 제목
  description: 설명
  date: 2024-01-01
  tags: [태그1, 태그2]
  image: ./assets/image.png   # 폴더형 글만
  slug: custom-slug           # (옵션)
  ---
  ```
- 이미지는 **폴더형 글**(`contents/articles/<slug>/index.md`) 기준 `./assets/` 아래에 둡니다.
- 드래프트 확인: `pnpm dev:drafts` (env `INCLUDE_DRAFTS=1`)

---

## 4. 디자인 시스템 — `packages/design-system`

- 패키지명: `@vallista/design-system`
- **Vanilla Extract** 기반 CSS-in-JS + Storybook
- 제공 컴포넌트(일부): Badge, Button, Capacity, Checkbox, Collapse, Container, Footer, Icon, Image, Input, LoadingDots, Modal, Note, Progress, Radio, Select, ShowMore, Snippet, Spacer, Spinner, Switch, Tabs, Tag, Tags, Text, ThemeProvider, Toast, Toggle, Tooltip, Video
- 추가 export: `/hooks`, `/theme`, `/utils`, `/styles` (`design-system.css`)
- 블로그에서는 `import '@vallista/design-system/global.css'`로 전역 스타일을 주입합니다 (`src/main.tsx`).

**컴포넌트 개발 흐름** (README 기준):
1. `packages/design-system/src/components/<Name>/` 에 제작
2. `src/index.ts`에 export 추가
3. `services/new-blog/src/`에서 사용해 동작 확인
4. Storybook: `pnpm storybook`

---

## 5. 주요 명령어 (루트에서)

| 목적 | 명령어 |
|---|---|
| 의존성 설치 | `pnpm i` |
| 블로그 개발 서버 | `pnpm dev:new-blog` |
| 디자인 시스템 watch 빌드 | `pnpm watch:ds` |
| 블로그 빌드 | `pnpm build:new-blog` |
| 블로그 미리보기 | `pnpm preview:new-blog` |
| 타입 체크 | `pnpm type-check:new-blog` |
| 린트 | `pnpm lint:new-blog` / `pnpm lint:fix:new-blog` |
| 테스트 | `pnpm test:new-blog` / `pnpm test:ui:new-blog` |
| 콘텐츠 JSON 재생성 | `pnpm generate-content:new-blog` |
| SEO 파일 생성 | `pnpm generate-seo:new-blog` |
| **배포** | `pnpm deploy:new-blog` |

> 구 Gatsby 블로그(`services/blog`)는 레포에 남아있지만 루트 `package.json`에서 해당 스크립트 체인은 모두 제거되어 있습니다. 참고용으로만 존재합니다.

**개발 일반 흐름**:
```bash
# 1번 탭
pnpm watch:ds
# 2번 탭
pnpm dev:new-blog
```

---

## 6. 빌드 · 배포 파이프라인

### 빌드 (`services/new-blog/package.json`의 `build`)

```
generate-content  →  generate-favicon  →  vite build  →  generate-seo  →  copy-404
```

### 배포 (`scripts/deploy.js`)

1. `pnpm build` (위 빌드 시퀀스 — `generate-seo`, `copy-404` 포함)
2. `gh-pages` CLI로 `dist/`를 **`Vallista/vallista.github.io`** 레포의 **`main`** 브랜치에 push
3. 인증은 `process.env.TOKEN` 또는 `GITHUB_TOKEN` 필요 (PAT, `repo` scope)

- 결과물 URL: `https://vallista.github.io`
- `--dotfiles` 옵션으로 `.nojekyll` 등도 같이 커밋됨

### 배포 사전 체크리스트

- [ ] `TOKEN` 환경 변수 존재 (크로스-레포 push용 PAT)
- [ ] `pnpm type-check:new-blog` / `pnpm lint:new-blog` 통과
- [ ] 로컬에서 `pnpm preview:new-blog`로 최종 확인
- [ ] 콘텐츠 변경이 있다면 `generate-content` 결과(`public/contents/`) 포함 여부 확인

---

## 7. 작업 워크플로우 (이 레포에 적용)

이 레포 작업 시 **이 순서를 지킵니다**:

1. **브랜치 분기** — `main`에서 feature 브랜치 생성
   - 이름 규칙 예: `feat/<주제>`, `fix/<주제>`, `chore/<주제>`
2. **작업 + 커밋** — Conventional Commits 규칙
   - `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `style:`, `test:` …
   - Husky pre-commit hook이 `lint-staged` 실행 (eslint --fix + prettier --write)
3. **자체 코드 리뷰** — 병합 전 diff를 읽고 품질 확인 (중복/네이밍/타입/부수효과)
4. **메인 머지** — 리뷰 통과 시 `main`으로 머지 (fast-forward 우선)
5. **배포** — 사용자가 "배포해줘"라고 명시할 때만 `pnpm deploy:new-blog` 실행

> 강제 푸시·amend·`-D` 브랜치 삭제는 **사용자 명시 요청이 있을 때만** 수행합니다. 데이터 손실을 막기 위해 돌이킬 수 없는 git 연산은 항상 확인 후 진행합니다.

---

## 8. 코드 리뷰 체크리스트 (자체 리뷰용)

- [ ] **기존 패턴 재사용**: 유사 컴포넌트/훅이 `@vallista/design-system` 또는 `shared/`에 이미 있지 않은가?
- [ ] **FSD 레이어 준수**: `shared → features/widgets → pages → app` 방향성 역류 없음
- [ ] **타입 안전성**: `any` 없이 작성, path alias 사용
- [ ] **Vanilla Extract**: 런타임 스타일 대신 `*.css.ts`로 정적 스타일 작성
- [ ] **접근성/반응형**: 모바일(767px 이하) / 태블릿 / 데스크톱(1025+) 동작 확인
- [ ] **콘텐츠 변경 시**: frontmatter 필수 필드 체크, `generate-content` 재실행 결과 확인
- [ ] **테스트/타입체크 통과**: `pnpm type-check:new-blog`, `pnpm lint:new-blog`
- [ ] **SEO 영향**: 라우트/메타/sitemap 영향 있으면 `generate-seo` 결과 검토

---

## 9. 알아두면 좋은 함정

- **콘텐츠 상태는 빌드 산출물에 있다** — `public/contents/*.json`은 `generate-content`가 만들어냅니다. 이것을 수작업으로 편집하면 다음 빌드 때 덮어써집니다.
- **두 개의 블로그** — `services/blog`(Gatsby, legacy)와 `services/new-blog`(현재)가 공존합니다. 신규 변경은 `new-blog` 쪽만 하세요.
- **디자인 시스템은 빌드가 필요하다** — `@vallista/design-system`은 `dist/`를 export합니다. 타입/스타일 변경 후 `pnpm watch:ds` 또는 `pnpm build:ds`가 돌고 있어야 블로그에서 최신 버전이 반영됩니다.
- **배포는 크로스-레포 push** — 빌드 결과가 이 레포가 아닌 `Vallista/vallista.github.io`로 나갑니다. `TOKEN`(PAT)이 없으면 실패합니다.
- **클라이언트 리다이렉트** — `/contents/articles/:slug` 로 들어온 요청은 `main.tsx` 최상단에서 `/articles/:slug` 로 `window.location.replace` 합니다. 이 흐름을 건드릴 때 주의하세요.

---

## 10. 참고 문서

- 루트 `README.md` — 설치·실행 빠른 매뉴얼
- 루트 `REFACTORING_GUIDE.md` — 리팩터링 히스토리/가이드
- `services/new-blog/README.md` — new-blog 상세 README
- `services/new-blog/ARCHITECTURE.md` — FSD 기반 상세 아키텍처 문서
- `services/new-blog/docs/giscus-setup.md` — 댓글 세팅
- `services/new-blog/docs/safari-status-bar-analysis.md` — iOS 사파리 대응 메모
- `packages/design-system/README.md` — 디자인 시스템 사용법
