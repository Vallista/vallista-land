# vallista-land Memory

결정 히스토리와 진행 컨텍스트.

---

## 아키텍처 결정

- 2026-09-29: `pnpm-lock.yaml`을 CI와 같은 pnpm 9로 v9.0 재생성(기존 923개 패키지 버전 변경 없음, recharts만 추가). 이유: 로컬 전역 pnpm 12가 v6 lockfile을 "broken"으로 보고 자동 install에서 의존성 전체를 최신으로 재해석해 버림. 버린 대안: pnpm 12가 만든 lockfile 유지(배포 의존성 통째 변경 리스크), v6 유지(pnpm 12로 로컬 작업 불가). 로컬 실행은 `npx -y pnpm@9 <cmd>`.

<!-- 기술 선택 이유, 대안을 버린 근거 등 -->

## 시도했다가 버린 접근

<!-- 해봤는데 안 됐던 것 + 이유 -->

## 진행 컨텍스트

- Glean→노트 승격(`apps/admin/src/screens/Glean/PromoteDialog.tsx` `buildSeedMarkdown`)이 `date` 없이 노트를 쓰고 이미지를 `[img]data:` base64 텍스트로 본문에 넣음. 블로그 notes 스키마는 `date` 필수라 `pnpm build:blog`가 실패함. `contents/notes/wrap-small-thinking.md`는 이 이유로 미커밋 상태. 승격 코드 수정 필요.

<!-- 현재 브랜치/작업의 큰 그림 -->
