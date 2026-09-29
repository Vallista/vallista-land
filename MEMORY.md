# vallista-land Memory

결정 히스토리와 진행 컨텍스트.

---

## 아키텍처 결정

- 2026-09-29: `pnpm-lock.yaml`을 CI와 같은 pnpm 9로 v9.0 재생성(기존 923개 패키지 버전 변경 없음, recharts만 추가). 이유: 로컬 전역 pnpm 12가 v6 lockfile을 "broken"으로 보고 자동 install에서 의존성 전체를 최신으로 재해석해 버림. 버린 대안: pnpm 12가 만든 lockfile 유지(배포 의존성 통째 변경 리스크), v6 유지(pnpm 12로 로컬 작업 불가). 로컬 실행은 `npx -y pnpm@9 <cmd>`.
- 2026-09-29: 주 시작일 설정을 `apps/admin/src/lib/weekStart.ts` 단일 모듈(훅 + `bento:week-start-changed` 이벤트)로 통합. Plan 5일 '주' 뷰는 업무 주라 설정과 무관하게 월–금 고정, 월/티켓/WeekProgress만 설정을 따름. 버린 대안: 화면마다 localStorage 직접 읽기(변경 전파 안 됨, 기존 버그 원인).
- 2026-09-29: 티켓 모드 미완료 보기는 오른쪽 380px 패널의 [타임라인 | 미완료] 전환으로 구현(`Plan/IncompletePanel.tsx`). 날짜별(지연→오늘→예정→미정) / 할 일별(부모 Task + 연결 블록 + 서브태스크 진행률). 행 클릭 = 해당 날짜로 이동(날짜 없는 할 일만 편집기). 외부 캘린더 이벤트는 제외, 블록은 로드된 ±60일만·할 일은 전체. 버린 대안: 스트립 안 인라인 그룹핑(가로 스크롤과 충돌), 별도 화면(맥락 단절).
- 2026-09-29: Glean→노트 승격은 폴더형 노트(`contents/notes/<slug>/index.md` + `assets/N.<ext>`)로 쓰고 프론트매터에 `date`(생성 시각)를 넣는다. Threads의 `[img]data:` 마커는 `write_asset` 커맨드로 파일화하고 본문은 `![](assets/N.ext)`로 참조. `ensure_inside`는 존재하는 가장 가까운 조상 기준으로 검증하도록 일반화(이전엔 부모 디렉터리가 없으면 거부라 폴더형 노트·`notes/reports/` 생성이 불가했음). 버린 대안: 이미지 마커 삭제(Threads CDN URL은 만료라 복구 불가), 단일 `.md` 유지(assets 둘 곳 없음).
- apps/admin 코드는 루트 `.prettierrc`(semi false)와 달리 세미콜론·trailing comma 스타일이며 루트 설정으로 포맷된 적 없음. admin 새 파일은 `prettier --no-config --semi --single-quote --trailing-comma all --print-width 100 --arrow-parens always`로 포맷하고, 기존 파일 전체 재포맷은 하지 않는다.

<!-- 기술 선택 이유, 대안을 버린 근거 등 -->

## 시도했다가 버린 접근

<!-- 해봤는데 안 됐던 것 + 이유 -->

## 진행 컨텍스트

- 블로그는 `draft`만 거르고 `state`는 보지 않으므로 승격된 seed 노트도 push 즉시 공개 렌더링된다. seed를 숨길지(`draft: true` 기본 또는 blog에서 state 필터)는 미결.
- Bento Rust 커맨드(`write_asset`, `ensure_inside`)가 바뀌었으므로 승격 기능을 쓰려면 앱 재빌드(`tauri build`) 필요. 프론트만 갱신하면 `write_asset` 없음 오류.

<!-- 현재 브랜치/작업의 큰 그림 -->
