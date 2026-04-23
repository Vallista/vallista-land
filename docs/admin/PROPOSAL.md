# vallista-land 로컬 어드민 앱 제안서

> 목적: 로컬에서 블로그 글(프로젝트/짧은 글/긴 글)을 작성·편집·분류·삭제하고 GA 지표를 함께 확인하는 어드민 도구. 배포는 기존 파이프라인(`git push origin main` → Actions) 그대로 사용.

---

## 1. 요구사항 정리

### 1.1 핵심 기능

| # | 기능 | 상세 |
|---|---|---|
| F1 | 글 목록 | 카테고리(프로젝트/짧은 글/긴 글)별 리스트, 상태(공개/초안/삭제) 필터, 제목·태그 검색 |
| F2 | 신규 작성 | 카테고리 선택 → 에디터 진입. 기본 프론트매터 자동 생성(slug, date) |
| F3 | 에디터 | **두 가지 뷰 전환**: ① 마크다운 소스 ② 블로그 레이아웃 프리뷰(WYSIWYG). 실시간 저장(autosave) + 수동 저장 |
| F4 | 메타데이터 | 제목, 태그(다중), 설명(dek), 커버, 시리즈, draft 플래그 편집 |
| F5 | 분류 변경 | 짧은 글 ↔ 긴 글 ↔ 프로젝트 이동 (디렉토리/파일 이동 + 스키마 변환) |
| F6 | 초안/공개 토글 | `draft: true/false` 스위치 |
| F7 | 소프트 삭제 | 휴지통으로 이동. 복구/영구 삭제 가능 |
| F8 | 발행 | "발행" 버튼 → git add/commit/push (또는 커밋 메시지만 생성하고 사용자가 수동 push) |
| F9 | GA 대시보드 | 페이지뷰, 인기 글 TOP N, 방문자 추이, 유입 경로 (최근 7/30일) |

### 1.2 비기능 요구사항

- **로컬 전용**: 인증·호스팅 불필요. `pnpm dev:admin` 으로 localhost에서 실행
- **파일 기반**: `contents/` 디렉토리를 단일 진실 소스(SSoT)로 유지. DB 없음
- **기존 스키마 호환**: `apps/blog/src/content.config.ts`의 Content Collections 스키마를 깨지 않음
- **배포 파이프라인 무변경**: main에 push 시 Actions가 빌드. 어드민은 배포 번들에 포함되지 않음
- **데이터 안전성**: 파일 쓰기 전 백업(.trash 또는 git stash), 머지 충돌 방지를 위한 파일 락

### 1.3 비범위 (명시적 제외)

- 멀티 유저/권한/원격 배포
- 댓글·반응 관리
- 이미지 업로드 CDN 연동 (로컬 `assets/` 복사만)
- AI 글 생성

---

## 2. 현행 데이터 모델 (조사 결과)

### 2.1 디렉토리와 카테고리 매핑

현재 `contents/`는 이미 카테고리별로 분리돼 있음. 요구사항의 카테고리를 그대로 매핑 가능:

| 요구 카테고리 | 디렉토리 | 현재 글 수 | 파일 형식 |
|---|---|---|---|
| 긴 글 | `contents/articles/` | ~75개 | `*.md` 또는 `제목/index.md` (+ `assets/`) |
| 짧은 글 | `contents/notes/` | 0개 | `*.md` |
| 프로젝트 | `contents/projects/` | 0개 | `*.yaml` / `*.yml` |

### 2.2 프론트매터 스키마 (apps/blog/src/content.config.ts:20-59 기반)

```yaml
title: string            # 필수
date: date               # 필수
tags: string[]
description / dek: string
draft: boolean           # 기본 false
info: boolean
image: string            # 상대 경로 (./assets/...)
slug: string
featured: boolean
cover: 'grid' | 'stripes' | 'dots' | 'blocks' | 'lines'
series: string | { name, slug, order, total }
updated: date
```

### 2.3 제안하는 확장 필드 (신규)

소프트 삭제와 감사 로그를 위해 아래 필드를 스키마에 **optional로** 추가:

```yaml
status: 'published' | 'draft' | 'trashed'   # draft 플래그 대체/병행
deletedAt: date                             # 휴지통 이동 시각
lastEditedBy: string                        # 로컬 git user.name (감사용)
```

> `draft: boolean`을 유지하면서 `status`를 추가하는 방식이 기존 글 호환성 측면에서 안전. 빌드 시 `status === 'trashed'`는 페이지 생성에서 제외.

---

## 3. 아키텍처 제안

### 3.1 전체 구조

```
vallista-land/
├── apps/
│   ├── blog/          (기존, ArticleLayout만 공용 렌더러 연결로 소폭 수정)
│   └── admin/         ★ 신규
│       └── src/
│           ├── server/        # 파일 I/O + GA API (Hono)
│           ├── routes/        # 라우트
│           ├── components/    # UI
│           └── lib/           # 공용 유틸
├── packages/
│   ├── ui/            (재사용)
│   └── content-renderer/  ★ 신규 (MDX → HTML 공용 렌더)
└── contents/          (SSoT, admin이 직접 읽고 씀)
```

### 3.2 프레임워크 선택지

| 옵션 | 장점 | 단점 | 추천도 |
|---|---|---|---|
| **A. Astro SSR (node adapter)** | 기존 스타일/컴포넌트(@vallista/ui) 그대로 재사용. 학습 비용 0. 블로그와 동일 렌더링 프리뷰 가능 | 에디터 같은 상태 많은 UI는 React island 필요 → 구조가 애매 | △ |
| **B. Vite + React + Express(or Hono) 백엔드** | 에디터 UI 자유도 최고. Tiptap/CodeMirror 친화적. 경량 | @vallista/ui 컴포넌트가 Astro 기반이라 일부 재작성 필요 | ★★★ |
| **C. Next.js (App Router)** | 풀스택 한 방. API Route로 파일 I/O 묶기 쉬움 | 오버엔지니어링 가능성. Astro/Vite 스택과 이질감 | ★★ |

**추천: B (Vite + React + Hono)**. 이유:
- 어드민은 블로그와 UX 목적이 완전히 다름(읽기 vs 편집) → 스택 통일 집착 불필요
- Tiptap/CodeMirror 생태계가 React 중심
- 백엔드는 로컬 전용이라 Hono 같은 초경량 프레임워크로 충분
- `@vallista/ui`의 디자인 **토큰**(`vars`, lightTheme/darkTheme)은 그대로 import해 쓸 수 있음. 컴포넌트는 shadcn/ui 기반으로 새로 조립하되 토큰을 공유해 톤 유지

### 3.3 서버 레이어

로컬에서만 도는 경량 HTTP 서버(포트 예: 4321). 담당:

- `GET /api/posts?category=articles` — 파일 목록 + 프론트매터 파싱
- `GET /api/posts/:id` — 단일 글 읽기
- `PUT /api/posts/:id` — 저장 (원자적 쓰기: tmp → rename)
- `POST /api/posts` — 신규 생성
- `POST /api/posts/:id/move` — 카테고리 이동 (파일 이동 + 스키마 변환)
- `POST /api/posts/:id/trash` — 소프트 삭제
- `POST /api/posts/:id/restore` — 복구
- `DELETE /api/posts/:id` — 영구 삭제 (확인 2회 필요)
- `POST /api/publish` — `git add . && git commit -m "..." && git push` 실행
- `GET /api/analytics/*` — GA Data API 프록시

**파일 쓰기 안전 장치**:
1. 모든 쓰기는 `tmp` 파일에 쓰고 `rename`으로 원자 교체
2. 쓰기 전 해당 파일의 git 해시 비교(stale write 감지)
3. 삭제는 항상 `.trash/{timestamp}-{slug}/`로 이동, 7일 후에도 유지 (수동 비우기)

### 3.4 에디터 선택지

| 옵션 | 성격 | 장단점 |
|---|---|---|
| **Tiptap** (ProseMirror) | WYSIWYG 중심, 마크다운 변환 지원 | React와 궁합 최고, 확장 풍부. 마크다운 왕복(round-trip) 시 일부 문법 손실 가능 |
| **Milkdown** | 마크다운 네이티브 WYSIWYG | Tiptap 기반 + 마크다운 우선. 생태계 작음 |
| **CodeMirror 6** | 마크다운 raw 에디터 | 문법 강조만. WYSIWYG 아님 |

**추천: CodeMirror 6(소스 뷰) + Tiptap(레이아웃 뷰) 병행**
- 상단 탭: `[마크다운] [레이아웃] [미리보기]`
- 소스 뷰(CodeMirror): 진실 소스. 저장도 여기 기준
- 레이아웃 뷰(Tiptap): 소스를 파싱해 렌더. 편집 시 마크다운으로 역변환
- 미리보기: 실제 블로그 렌더링(아래 §3.5)

### 3.5 "실제 블로그 레이아웃으로 프리뷰" — 공용 렌더러 패키지

`packages/content-renderer`를 신설해 마크다운 → HTML 변환을 양쪽에서 공유.

**구성**:
- `unified` + `remark-parse` + `remark-gfm` + 기존 `remark-article-assets` → `remark-rehype` → rehype 플러그인 → `rehype-stringify`
- 입력: 마크다운 문자열 + 프론트매터 / 출력: HTML 문자열 + 메타(제목 트리, 링크, reading time)
- 기존 `apps/blog/src/lib/remark-article-assets.mjs`, `lib/reading-time.ts`, `lib/excerpt.ts`는 이 패키지로 이관

**양측 사용**:
- `apps/blog` ArticleLayout: 렌더러가 낸 HTML을 `<Fragment set:html={...} />`로 주입. 레이아웃 쉘(헤더/커버/TOC)과 CSS는 그대로
- `apps/admin` 미리보기: 동일 함수 호출 → `dangerouslySetInnerHTML`로 렌더. `apps/blog`의 `article.css`를 admin에서도 import해 시각 동일성 확보

**트레이드오프 (Phase 2.5 진입 시 실사 필요)**:
- MDX 내 Astro 컴포넌트 사용(e.g. `<Callout>`)이 많다면 admin에서도 동일한 React 컴포넌트를 매핑해야 함
- 현재 `contents/articles/`는 순수 마크다운 위주로 보이지만, Phase 2.5 착수 시 `grep '^import '`로 실사 후 범위 확정
- Astro 측 렌더를 렌더러 기반으로 교체할 때 모든 기존 글에 대한 시각 회귀(VRT) 점검 필요

---

## 4. UI 설계

### 4.1 전체 레이아웃 (데스크탑)

```
┌─────────────────────────────────────────────────────────────────┐
│ [vallista-admin]                    [발행 N개]  [설정] [테마]    │  ← 상단바
├──────────────┬──────────────────────────────────────────────────┤
│              │                                                   │
│ 대시보드     │                                                   │
│ ────────     │                                                   │
│ 긴 글 (75)   │               메인 영역                            │
│ 짧은 글 (0)  │        (선택한 사이드 항목에 따라                   │
│ 프로젝트(0)  │         리스트/에디터/대시보드 전환)                │
│ ────────     │                                                   │
│ 초안 (3)     │                                                   │
│ 휴지통       │                                                   │
│              │                                                   │
│ ────────     │                                                   │
│ 태그         │                                                   │
│  #회고 (4)   │                                                   │
│  #React (8)  │                                                   │
└──────────────┴──────────────────────────────────────────────────┘
```

### 4.2 글 목록 뷰

- 테이블: 제목 · 카테고리 · 태그 · 작성일 · 상태 · 조회수(GA) · 액션(편집/분류변경/삭제)
- 상단: 검색창 + 필터 칩(상태: 전체/공개/초안/휴지통)
- 우상단: `[+ 새 글]` 버튼 → 카테고리 선택 드롭다운

### 4.3 에디터 뷰

```
┌──────────────────────────────────────────────────────────────────┐
│ ← 목록   [마크다운] [레이아웃] [미리보기]     [저장됨 12:34]  [발행]│
├───────────────────────────────────┬──────────────────────────────┤
│                                   │ 메타데이터                    │
│                                   │ ─────────                    │
│                                   │ 카테고리: [긴 글 ▼]           │
│     에디터 영역                    │ 제목: [_______________]       │
│   (소스 또는 레이아웃)             │ slug: [_______________]       │
│                                   │ 날짜: [2026-04-22 ▼]          │
│                                   │ 태그: [#회고] [#React] [+]    │
│                                   │ 설명: [_______________]       │
│                                   │ 커버: [grid ▼]                │
│                                   │ 시리즈: [선택 ▼]              │
│                                   │ 상태: ◉공개 ○초안              │
│                                   │ ─────────                    │
│                                   │ [🗑 휴지통으로]                │
└───────────────────────────────────┴──────────────────────────────┘
```

- 좌측은 탭으로 마크다운/레이아웃/미리보기 전환. 레이아웃 탭이 WYSIWYG(Tiptap)
- 우측 메타패널은 폼. 변경 즉시 프론트매터에 반영되고 자동 저장
- 단축키: `⌘S` 저장, `⌘↵` 발행 다이얼로그, `⌘P` 미리보기

### 4.4 대시보드(GA)

최상단에 KPI 카드 4개: 이번 주 PV / 방문자 / 평균 체류 / 인기 글 1위

그 아래:
- 일자별 PV 라인 차트 (최근 30일)
- 인기 글 TOP 10 테이블 (PV, 평균 체류, 이탈률)
- 유입 경로 파이 (Organic / Direct / Referral / Social)
- 태그별 PV 바 차트 (자체 집계 — 글 메타와 조인)

### 4.5 시각 스타일

- `@vallista/ui`의 디자인 토큰 재사용:
  - 색상: `vars.color.bg`, `ink`, `line`, `accent`, `status.green/amber/red`
  - 간격·반경·고도·z-index 동일
- 어드민 특유 요소(테이블, 드로어, 토스트)는 **shadcn/ui** 또는 **Radix UI**로 조립하되 위 토큰을 CSS 변수로 연결
- 다크/라이트 토글은 기존 `DarkModeToggle` 철학 그대로

---

## 5. GA 연동 설계

### 5.1 사전 작업 (코드 밖)

1. GA4 속성 생성, Measurement ID(`G-XXXXXXXX`) 발급
2. `apps/blog`의 `BaseLayout.astro`에 gtag 스니펫 삽입 (별도 PR)
3. GCP 프로젝트 → GA Data API 활성화 → 서비스 계정 키(JSON) 발급 → GA4 속성에 뷰어로 추가

### 5.2 어드민에서의 접근

- 키 파일은 `apps/admin/.secrets/ga-sa.json` (gitignore 필수)
- 서버 측에서 `@google-analytics/data` SDK로 호출 → 프론트에는 집계 결과만
- 주요 쿼리:
  - `runReport` with `pagePath`, `screenPageViews`, `averageSessionDuration`
  - 기간: 최근 7/30/90일 선택
- 캐싱: 메모리 5분 TTL (로컬 툴이라 가벼워도 됨)

### 5.3 글 메타와 조인

GA 응답의 `pagePath`(예: `/articles/xxx`)에서 slug 추출 → `contents/`의 프론트매터와 조인해 제목·태그 부착. 태그별 집계는 여기서 자체 생성.

---

## 6. 소프트 삭제 설계 (Data Safety)

CLAUDE.md의 데이터 손실 방지 규칙 준수:

1. **삭제 API는 절대 unlink 하지 않음**. `contents/.trash/{YYYYMMDDHHmm}-{original-path}/` 로 이동
2. 프론트매터에 `status: trashed`, `deletedAt: ISO8601` 주입
3. 어드민 UI "휴지통" 섹션에서 복구 가능
4. 영구 삭제는 별도 페이지에서 텍스트 확인 입력(파일명 타이핑) 후에만 실행
5. 빌드 시 `apps/blog`는 `contents/.trash/` 전체를 content collection에서 제외(`exclude` 옵션 추가)
6. 첫 릴리스 전 필수: 로컬 폴더 주기적 백업 스크립트(`scripts/backup-contents.sh`) 또는 별도 git 원격 저장소

**사전 고지(Pre-flight Warning)**: 발행/삭제/카테고리 이동은 파일 시스템에 대한 돌이킬 수 없는 작업. 첫 구현 시 스테이징 환경(복제본 디렉토리)에서 드라이런 후 실제 적용.

---

## 7. 구현 로드맵

### Phase 0. 준비 (0.5일)
- `apps/admin` 스캐폴딩 (Vite + React + Hono)
- `@vallista/ui` 토큰을 admin에 연결
- `pnpm dev:admin` 스크립트 (admin 단독 실행)
- Actions 워크플로가 admin을 빌드·배포하지 않는지 재확인

### Phase 0.5. GA 데이터 적재 선행 (0.5일) — blog PR
- GA4 속성 생성, Measurement ID 발급 (사용자 작업)
- `apps/blog` `BaseLayout.astro`에 gtag 스니펫 삽입 + env 분기(`import.meta.env.PUBLIC_GA_ID`)
- 이 시점부터 데이터가 쌓이기 시작 → Phase 5 대시보드에서 쓸 수 있는 기간 확보

### Phase 1. 읽기 전용 CMS (1.5일)
- 사이드바 + 카테고리별 글 목록
- 검색/필터/정렬
- 상세 뷰 (원본 마크다운 렌더)

### Phase 2. 에디터 + 저장 (2일)
- CodeMirror 소스 에디터 + 프론트매터 폼
- 원자적 파일 쓰기 + autosave + stale write 감지
- 신규 생성 플로우

### Phase 2.5. 공용 렌더러 패키지 추출 (1일)
- `packages/content-renderer` 신설
- `apps/blog` ArticleLayout을 렌더러 기반으로 교체
- 기존 75개 아티클에 대한 시각 회귀 점검 (주요 글 5~10개 브라우저 스냅샷 비교)

### Phase 3. WYSIWYG + 미리보기 (1.5일)
- Tiptap 레이아웃 에디터 (마크다운 round-trip)
- 미리보기 탭: 공용 렌더러 + blog의 `article.css` 임포트로 동일 렌더

### Phase 4. 휴지통/분류 이동/발행 (1일)
- 소프트 삭제: `contents/.trash/{timestamp}-{path}/` 이동 + `status: trashed`
- `apps/blog` content collection에 `exclude: ['**/.trash/**']` 추가
- 카테고리 이동 (파일 이동 + 스키마 변환)
- 발행: 서버에서 `git add/commit/push` 실행. 커밋 메시지 템플릿 + 드라이런 미리보기

### Phase 5. GA 대시보드 (1.5일)
- GCP 서비스 계정 + `.secrets/ga-sa.json` (gitignore)
- Data API 연동 + 5분 TTL 캐시
- KPI 카드 / 일자별 PV / 인기 글 / 태그별 PV

**총 ~9.5일**. Phase 1까지만 해도 즉시 실용. Phase 0.5는 다른 Phase와 독립적이라 먼저 치는 것이 유리.

---

## 8. 확정된 결정 사항

| # | 항목 | 결정 |
|---|---|---|
| 1 | 프레임워크 | **Vite + React + Hono** |
| 2 | 에디터 전략 | **마크다운 소스를 SSoT**로 두고 Tiptap은 레이아웃 보조 뷰 |
| 3 | 미리보기 | **공용 렌더러 패키지(`packages/content-renderer`) 분리** — blog와 admin이 공유 |
| 4 | 발행 트리거 | 어드민에서 **`git add/commit/push` 직접 실행** (드라이런 미리보기 포함) |
| 5 | GA 작업 순서 | **Phase 0.5에 gtag 선행 삽입** → 데이터 적재 조기 시작 |
| 6 | 소프트 삭제 | **`contents/.trash/`로 이동** + 프론트매터 `status: trashed` |
| 7 | 카테고리 스키마 | notes·articles·projects **동일 스키마로 시작**. projects는 추후 포맷 분화 가능성 열어둠 (에디터는 현 단계에선 통일) |
| 8 | 배포 제외 방식 | **gitignore 하지 않음**. Actions 워크플로가 `pnpm build:blog`만 타겟하므로 자동 제외. 혼동 방지를 위해 `.github/workflows/node.js.yml`에 관련 주석 추가 |

---

## 9. 다음 단계

1. **Phase 0 + Phase 0.5를 먼저 착수**하는 것을 추천 (둘 다 짧고 독립적)
   - Phase 0: `apps/admin` 스캐폴딩
   - Phase 0.5: `apps/blog`에 gtag 삽입 — 단, GA4 Measurement ID는 사용자 발급 필요
2. 착수 시 Plan 모드로 파일 단위 변경 목록을 먼저 제시 → 승인 후 실행
3. 각 Phase 종료 후 짧은 리뷰로 다음 Phase 범위 재검토

---

## 부록 A. 환경 변수

| 키 | 값 / 용도 | 위치 |
|---|---|---|
| `PUBLIC_GA_ID` | `G-19TWWVQ233` (GA4 Measurement ID) | 로컬: `apps/blog/.env.local` · 배포: GitHub repo Secrets |

**운영 작업 체크리스트 (Phase 0.5 완료 조건)**:
- [x] `apps/blog/src/layouts/BaseLayout.astro`에 gtag 스니펫 삽입
- [x] SPA 네비게이션에 수동 `page_view` 이벤트 발송
- [x] `apps/blog/.env.local` 생성 (gitignore 됨)
- [x] `.github/workflows/node.js.yml`에 `PUBLIC_GA_ID` env 전달
- [ ] **GitHub repo Settings → Secrets and variables → Actions → `PUBLIC_GA_ID = G-19TWWVQ233` 등록 (사용자 작업)**
- [ ] main push 후 GA Realtime 대시보드에서 PV 수신 확인
