# vallista-land

@MEMORY.md

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

## admin 앱 필수 패턴 (apps/admin)

**Tauri IPC**: 모든 `invoke<T>()` 호출은 `apps/admin/src/lib/tauri.ts`에만. 화면·컴포넌트에서 직접 호출 금지.
새 커맨드 추가 시 3곳 동시 등록: `src-tauri/src/commands/<x>.rs` → `src-tauri/src/lib.rs invoke_handler![]` → `src/lib/tauri.ts` wrapper.

**Cancellation pattern**: 비동기 `useEffect` 내부에 `await` + `setState`가 있으면 반드시 아래 패턴 적용.
```ts
useEffect(() => {
  let cancelled = false
  fetchSomething().then(r => { if (!cancelled) setState(r) })
  return () => { cancelled = true }
}, [deps])
```

**도메인 타입**: `packages/content-core/src/types.ts`가 진실의 원천. 동일 모양을 컴포넌트에서 재정의하지 말 것.

**디자인 토큰**: 색·간격은 `var(--token)` CSS 변수. hex/픽셀 하드코딩 금지.

## macOS 권한 처리 패턴 (apps/admin)

권한 오류는 **toast 절대 금지 — 전체 팝업 모달**로만 처리한다.

- 모달 구성: 좌측(설명·버튼) + 우측(macOS 시스템 설정 CSS 프리뷰, 해당 앱 행 파란 강조 + "← 여기를 켜세요")
- `authorization === 'notDetermined'` → 권한 요청 다이얼로그 → 허용 시 즉시 재시도
- `authorization === 'denied' | 'restricted'` → `openPrivacy()` 자동 호출 + 재확인 버튼
- 참조 구현: `apps/admin/src/screens/Plan/CalPermissionModal.tsx`
- 새 권한 모달이 필요하면 `/permission-modal <기능명>` skill 사용

## Rust 필수 패턴 (apps/admin/src-tauri)

- `#[tauri::command]` 반환 타입은 항상 `Result<T, String>`. 베어 `.unwrap()` 금지.
- 응답 struct에 `#[serde(rename_all = "camelCase")]` 필수.
- 파일 경로 검증: `ensure_inside(root, &p)?` 없이 사용자 입력으로 파일 I/O 금지.
