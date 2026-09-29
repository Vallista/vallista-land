# Vallista Land — 프로젝트 가이드

개인 기술 블로그 `https://vallista.kr` 운영용 pnpm 모노레포.

## 구조

```
vallista-land/
├── apps/blog/          # Astro 블로그 (운영 중)
├── packages/ui/        # @vallista/ui — vanilla-extract primitives
├── contents/           # 블로그 마크다운 원본
│   ├── articles/       # 기술 글, 회고
│   ├── notes/          # 짧은 노트
│   └── projects/       # 프로젝트 카드 YAML
└── designs/handoff/    # 디자인 시스템 핸드오프 문서
```

## 기술 스택

- **Astro 5** + **vanilla-extract** + **TypeScript strict**
- **Pagefind** 정적 검색 (⌘K 팔레트)
- **pnpm workspace**
- **GitHub Pages 배포** (`Vallista/vallista.github.io` main 브랜치로 gh-pages push)

## 자주 쓰는 명령어

```bash
# 루트에서
pnpm dev          # 블로그 dev 서버 (http://localhost:4321)
pnpm build        # 블로그 빌드 (dist/)
pnpm preview      # 빌드 결과 미리보기
pnpm check        # Astro check (타입 체크)
pnpm deploy       # dist를 vallista.github.io로 배포
```

## 배포

`main` 브랜치에 push하면 `.github/workflows/node.js.yml`이 자동 실행:

1. `pnpm install --frozen-lockfile`
2. `pnpm build:blog` (Astro + Pagefind)
3. `deploy:only` — gh-pages로 `Vallista/vallista.github.io` main 브랜치에 push

**필요한 GitHub Secret**: `TOKEN` (repo scope PAT, 크로스-레포 push용)

## 콘텐츠 작성

`contents/articles/<slug>/index.md` 또는 `contents/articles/<slug>.md`:

```markdown
---
title: 글 제목
tags: [태그1, 태그2]
date: 2024-01-01
image: ./assets/cover.png
series: 시리즈명            # 선택
slug: custom-url-slug       # 선택
draft: false
---
본문...
```

본문의 `![](./assets/foo.png)` 이미지는 빌드 시 remark 플러그인이 `/contents/articles/<slug>/assets/foo.png`로 rewrite.

## 라우트

| path | 설명 |
|---|---|
| `/` | 홈 (Featured 1개 + Recent 4개) |
| `/articles` | 전체 아티클 |
| `/articles/[slug]` | 아티클 상세 |
| `/series` + `/series/[slug]` | 시리즈 목록/상세 |
| `/tags` + `/tags/[tag]` | 태그 목록/상세 |
| `/notes` | 노트 타임라인 |
| `/projects` | 프로젝트 그리드 |
| `/about`, `/resume` | About/Resume 탭 (같은 컴포넌트) |
| `/rss.xml`, `/feed`, `/sitemap-index.xml`, `/robots.txt` | SEO |

## 작업 규칙

1. main에서 feature 브랜치 분기
2. 커밋 (Conventional Commits)
3. 자체 코드 리뷰
4. main fast-forward 머지
5. **배포는 사용자가 명시적으로 요청할 때만**
