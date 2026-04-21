# vallista-land

## 프로젝트 구조

- `apps/blog` — 현재 운영 중인 Astro 블로그 (`@vallista/blog-astro`)
- `packages/ui` — 공용 UI/디자인 토큰 (`@vallista/ui`)
- `contents/` — 아티클/노트/프로젝트 MDX 소스
- `services/blog`는 legacy. 신규 변경은 `apps/blog`에서.

## 배포

**main에 push하면 GitHub Actions이 자동 빌드·배포한다.** (`.github/workflows/node.js.yml`)

- 트리거: `push` to `main`
- 동작: `pnpm build:blog` → `pnpm --filter @vallista/blog-astro run deploy:only` → `Vallista/vallista.github.io` (main)에 push
- 로컬에서 `pnpm run deploy`를 돌릴 필요는 없다. PAT(`TOKEN`/`GITHUB_TOKEN`) 없이 push만 하면 된다.

## 작업 워크플로우

1. 브랜치에서 작업
2. 커밋 + 자체 diff 리뷰
3. main에 fast-forward 머지
4. `git push origin main` → Actions가 배포

## 빌드 검증

Edit/Write 후 `pnpm build:blog`로 빌드 에러 여부 확인. vanilla-extract CSS 변경 시 특히.
