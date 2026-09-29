---
name: code-review
description: |
  vallista-land 변경 코드를 프로젝트 고유 패턴 관점에서 리뷰한다.
  ESLint·tsc·clippy가 잡지 못하는 항목만 다룬다.
  "코드 리뷰", "리뷰해줘", "패턴 맞아?", "이거 우리 컨벤션?" 등에 사용.
---

# code-review skill

## 목표

자동화 도구가 잡지 못하는 **vallista-land 고유 패턴 위반**을 검출한다.
포맷·lint 이슈는 이미 Husky + PostToolUse 훅이 처리하므로 다루지 않는다.

---

## 절차

### 1단계: 변경 파일 수집

```bash
git diff HEAD --name-only
git diff --cached --name-only
git ls-files --others --exclude-standard
```

신규 파일은 Read 도구로 직접 읽는다.
변경이 없으면 "변경 사항 없음"을 출력하고 종료한다.

### 2단계: diff 읽기

변경된 파일의 diff 또는 전체 내용을 읽어 체크리스트를 적용할 근거를 확보한다.

### 3단계: 체크리스트 적용

변경 파일의 경로에 따라 해당 섹션만 적용한다.

---

## A. TypeScript / React (`apps/admin/src/**`, `apps/blog/src/**`, `packages/**`)

### A-1. Tauri IPC 추상화 [admin 한정] — Blocker
`apps/admin/src/lib/tauri.ts` 외의 파일에서 다음이 발견되면 위반:
- `import { invoke } from '@tauri-apps/api/core'`
- `invoke<` 직접 호출

권장 수정: `lib/tauri.ts`에 wrapper 추가 후 그 함수를 호출.

### A-2. Cancellation pattern — Blocker
`useEffect` 내부에 `await` 또는 `.then(` + `setState` 계열 호출이 있는데,
아래 세 가지가 모두 없으면 위반:
- `let cancelled = false`
- `if (cancelled)` / `if (!cancelled)` 가드
- cleanup `return () => { cancelled = true }`

`setInterval` 사용 시 cleanup의 `clearInterval` 누락도 같이 확인.

### A-3. 도메인 타입 중복 정의 — Warning
`DocSummary`, `Block`, `Task`, `Mood`, `GleanItem` 등
`@vallista/content-core`에 이미 있는 모양을 컴포넌트 파일에서 재정의하면 지적.
`Pick<>`/`Omit<>` 파생을 권장.

### A-4. 디자인 토큰 하드코딩 — Warning
인라인 style 또는 CSS에 `#hex`, `rgb(`, 픽셀 숫자가 새로 들어왔으면
`var(--token)` 대체 가능 여부를 검토해 제안.

### A-5. console.log 잔류 — Warning
production 코드에 `console.log`가 남아 있으면 지적.
`console.error`는 의도적 에러 로깅이므로 OK.

### A-6. IPC 에러 처리 누락 — Warning
`lib/tauri.ts` wrapper를 호출하는 코드에 `try/catch` 또는 `.catch`가 없으면
언마운트 후 에러가 콘솔에 뜰 수 있음을 지적.

---

## B. Rust (`apps/admin/src-tauri/src/**`)

### B-1. `#[tauri::command]` 반환 타입 — Blocker
반환 타입이 `Result<T, String>`이 아니라 bare 값이거나,
함수 내부에 `.unwrap()` (`.unwrap_or` 계열 제외)이 있으면 지적.

### B-2. Serde camelCase 누락 — Blocker
새 응답 struct에 `#[serde(rename_all = "camelCase")]`가 없으면 TS 쪽이 snake_case로 받아 깨진다.
`Option` 필드에 `#[serde(skip_serializing_if = "Option::is_none", default)]` 빠진 것도 확인.

### B-3. 경로 안전성 — Blocker
사용자 입력(path, id 등)으로 파일을 읽거나 쓰는 코드에
`ensure_inside(root, &p)?` 또는 동등한 경로 가드가 없으면 path traversal 위험.

### B-4. 3곳 동시 등록 확인 — Blocker
새 `#[tauri::command]` 함수가 추가됐는데 아래 중 하나라도 빠지면 위반:
1. `commands/mod.rs`에 `pub mod` 선언
2. `lib.rs`의 `invoke_handler![]`에 등록
3. `apps/admin/src/lib/tauri.ts`에 wrapper 추가

---

## C. 공통

### C-1. 새 의존성 — Warning
`package.json` 또는 `Cargo.toml`에 의존성이 추가됐으면
정말 필요한지, 번들 크기 영향, 라이선스를 한 줄 코멘트.

### C-2. CLAUDE.md 업데이트 필요 여부 — Nit
사용자에게 영향이 있는 동작 변경(새 IPC 커맨드, 새 파일 컨벤션 등)이 있으면
CLAUDE.md 업데이트를 제안.

---

## 4단계: 리포트 출력

```
코드 리뷰: <변경 요약 한 줄>

[Blocker] 머지 전 필수 수정
  • <파일:라인> — <항목> — <수정 제안>

[Warning] 가능하면 수정
  • ...

[Nit] 사소한 제안
  • ...

[Good] 잘된 점
  • ...

종합: Blocker N / Warning N / Nit N — <머지 가능 여부>
```

심각도 기준:
- **Blocker**: IPC 우회, cancellation 누락, unwrap, 경로 미검증, 등록 누락
- **Warning**: 타입 중복, 토큰 하드코딩, console.log, 에러 처리 누락
- **Nit**: 명명, 주석 스타일, 의존성 코멘트
- **Good**: 잘 적용된 패턴 (칭찬은 빠뜨리지 않는다)

---

## 동작 규칙

- **읽기 전용**. 코드를 자동 수정하지 않는다. 수정 제안은 코드 블록으로 보여주고 적용은 사용자에게 위임.
- **자동화 도구가 잡는 항목(lint, format)은 다루지 않는다.**
- Blocker가 있어도 모든 항목을 검사해 종합 리포트를 낸다.
- 출력은 한국어. 파일 경로·코드·에러 메시지는 원문 유지.
