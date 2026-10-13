# vallista-land Memory

결정 히스토리와 진행 컨텍스트.

---

## 아키텍처 결정

- 2026-09-29: `pnpm-lock.yaml`을 CI와 같은 pnpm 9로 v9.0 재생성(기존 923개 패키지 버전 변경 없음, recharts만 추가). 이유: 로컬 전역 pnpm 12가 v6 lockfile을 "broken"으로 보고 자동 install에서 의존성 전체를 최신으로 재해석해 버림. 버린 대안: pnpm 12가 만든 lockfile 유지(배포 의존성 통째 변경 리스크), v6 유지(pnpm 12로 로컬 작업 불가). 로컬 실행은 `npx -y pnpm@9 <cmd>`.
- 2026-09-29: 주 시작일 설정을 `apps/admin/src/lib/weekStart.ts` 단일 모듈(훅 + `bento:week-start-changed` 이벤트)로 통합. Plan 5일 '주' 뷰는 업무 주라 설정과 무관하게 월–금 고정, 월/티켓/WeekProgress만 설정을 따름. 버린 대안: 화면마다 localStorage 직접 읽기(변경 전파 안 됨, 기존 버그 원인).
- 2026-09-29: 티켓 모드 미완료 보기는 오른쪽 380px 패널의 [타임라인 | 미완료] 전환으로 구현(`Plan/IncompletePanel.tsx`). 날짜별(지연→오늘→예정→미정) / 할 일별(부모 Task + 연결 블록 + 서브태스크 진행률). 행 클릭 = 해당 날짜로 이동(날짜 없는 할 일만 편집기). 외부 캘린더 이벤트는 제외, 블록은 로드된 ±60일만·할 일은 전체. 버린 대안: 스트립 안 인라인 그룹핑(가로 스크롤과 충돌), 별도 화면(맥락 단절).
- 2026-09-29: Glean→노트 승격은 폴더형 노트(`contents/notes/<slug>/index.md` + `assets/N.<ext>`)로 쓰고 프론트매터에 `date`(생성 시각)를 넣는다. Threads의 `[img]data:` 마커는 `write_asset` 커맨드로 파일화하고 본문은 `![](assets/N.ext)`로 참조. `ensure_inside`는 존재하는 가장 가까운 조상 기준으로 검증하도록 일반화(이전엔 부모 디렉터리가 없으면 거부라 폴더형 노트·`notes/reports/` 생성이 불가했음). 버린 대안: 이미지 마커 삭제(Threads CDN URL은 만료라 복구 불가), 단일 `.md` 유지(assets 둘 곳 없음).
- 2026-10-12: TODO 인박스 폴더를 별도 엔티티로 전환. `TaskFolder {id,name,parentId?,createdAt}`를 `data_root/task_folders.json`에 저장하고 `Task.folderId`로 참조(`commands/task_folders.rs`). 기존 `팀명/ 제목` 접두어는 앱 첫 기동 시 `migrate_task_titles_to_folders`가 폴더로 옮기며, 멱등성은 config `taskFoldersMigrated` 플래그(제목 `/` 규칙이면 `A/B 테스트` 같은 제목이 매번 폴더화됨). 쓰기 직전 `data_root/backups/tasks-<ts>/tasks.json` 백업 → 되돌리기는 백업 복사 + config 플래그 제거. 폴더 해제는 `updateTask(id, { folderId: '' })`(`TaskPatch`가 serde `Option<Option<T>>`라 JSON `null`은 "변경 없음"). UI v1은 평면(하위 폴더 생성·폴더 간 이동·순서 변경 없음), 모델·트리·마이그레이션은 중첩 지원. 버린 대안: `Task.folder` 경로 문자열(이름 변경마다 tasks.json 전면 재작성, 빈 폴더 저장 불가), 접힘 상태를 메모리만 유지(재기동 시 초기화).
- 2026-10-12 (1차 자동 폴더화 철회): 팀명 접두어까지 전부 폴더가 되는 게 거슬린다는 피드백으로 '접두어 → 폴더' 변환을 되돌림. 접두어는 새 속성 `Task.group`(UI '구분', 자유 텍스트, 폴더와 공존, 해제는 `updateTask(id, { group: '' })`)으로 복원하고 행 안의 회색 칩으로만 표시(자동 묶음 없음), 폴더는 사용자가 `+ 폴더`로 만든 것만 유지. v1 커맨드 `migrate_task_titles_to_folders`는 삭제하고 `migrate_task_groups`(플래그 `taskGroupsMigrated`) 하나로 통합: (a) 1차가 돈 기기 → 최신 `backups/tasks-*/tasks.json`의 원제목 접두어 집합(모든 깊이)과 경로명(` / ` 결합)이 일치하는 폴더만 레거시로 판별, 소속 할 일은 `group=경로명`·`folderId` 제거, 사용자가 폴더를 지워 루트로 떨어진 할 일은 백업 `id → 접두어`로 복구, 레거시 폴더 삭제(그 아래 사용자 폴더는 루트로); (b) 1차 미실행 기기 → 제목 접두어를 바로 `group`으로. 쓰기 직전 `backups/task-groups-<ts>/{tasks.json,task_folders.json}` 백업 → 되돌리기는 두 파일 복원 + config `taskGroupsMigrated` 제거(v1 백업은 그대로 남음). 주의: 백업 접두어와 같은 이름의 사용자 폴더는 레거시로 취급됨(이 기기는 7개 모두 1차 생성분이라 해당 없음). 사용자가 이름을 바꾼 1차 폴더는 일치하지 않아 사용자 폴더로 유지(안전한 쪽). 실데이터 사본 사전 검증: 65건 `group` 부여(레거시 폴더 51 + 삭제 폴더 복구 14), 폴더 7개 제거, 2회차 skipped. 버린 대안: `tags` 재사용(다중값·태그 검색 UI와 의미 혼재), createdAt으로 레거시 판별(초 경계에 취약), 접두어 자동 그룹 표시(사용자가 '접두어 라벨' 칩 선택).
- 2026-10-13: `bento:rss-synced`는 "실제로 동기화한 피드가 있을 때만" 발생하는 이벤트로 계약을 바꿈(이전엔 폴러가 60초마다 빈 결과로도 emit → Glean이 매 분 목록을 비우고 스켈레톤으로 재마운트해 스크롤·페이지네이션 초기화). 수동 `sync_rss_feed(s)` 커맨드도 같은 이벤트를 emit하므로 UI는 폴러의 60초 하트비트에 기대면 안 됨. Glean 백그라운드 갱신은 `reloadInPlace`(불러온 개수만큼 offset 0부터 재조회, 스켈레톤·스크롤 유지)이고 `loadFirstPage`(비움+스켈레톤)는 마운트·필터 변경에만 쓴다. `GleanList`는 첫 항목 id/offset을 기억해 위쪽 삽입분만큼 scrollTop을 보정(WKWebView는 `overflow-anchor` 미지원). 버린 대안: 폴러 주기만 늘리기(수동 새로고침 완료 토스트가 폴러 이벤트에 의존해 깨짐), 프론트 디바운스(근본 원인 유지).
- apps/admin 코드는 루트 `.prettierrc`(semi false)와 달리 세미콜론·trailing comma 스타일이며 루트 설정으로 포맷된 적 없음. admin 새 파일은 `prettier --no-config --semi --single-quote --trailing-comma all --print-width 100 --arrow-parens always`로 포맷하고, 기존 파일 전체 재포맷은 하지 않는다.

<!-- 기술 선택 이유, 대안을 버린 근거 등 -->

## 시도했다가 버린 접근

<!-- 해봤는데 안 됐던 것 + 이유 -->

## 진행 컨텍스트

- 2026-10-12 미결 요청: "반복·루틴을 등록·관리". 현재는 `BlockKind 'routine'` 블록을 Today가 최근 30일 제목 기준으로 묶어 스트릭만 보여주고 반복 규칙 엔티티는 없음(외부 캘린더 반복은 발생분마다 블록 1개). 후보: A 루틴 템플릿(`routines.json`) → 당일 Task 멱등 생성 / B 요일·시간으로 가상 블록 전개(체크 시 실제 블록화, 스트릭 재사용) / C Task `repeat` 규칙, 완료 시 다음 회차 복제. 결정에 필요한 답: 루틴 단위(시간대 블록 vs 하루 체크리스트), 관리 위치(Today 스트릭 확장 / Plan 인박스 상단 / Tweaks), 필요한 반복 형태(매일·평일·요일·N일마다·매월 N일).
- 블로그는 `draft`만 거르고 `state`는 보지 않으므로 승격된 seed 노트도 push 즉시 공개 렌더링된다. seed를 숨길지(`draft: true` 기본 또는 blog에서 state 필터)는 미결.
- Bento Rust 커맨드가 바뀌었으므로(2026-09 `write_asset`·`ensure_inside`, 2026-10-12 `task_folders` 5종·`TaskPatch.folderId`·`migrate_task_groups`·`TaskPatch.group`, 2026-10-13 `sync_rss_feed(s)` AppHandle 인자·폴러 emit 조건) 승격·폴더 기능을 쓰려면 앱 재빌드(`npx -y pnpm@9 build:bento`) 후 dmg 설치 필요. 프론트만 갱신하면 커맨드 없음 오류.
- `TaskEditor.tsx`의 `color: color || null`은 serde `Option<Option>` 규약상 색상 해제가 no-op인 잠복 버그(`''`로 보내고 Rust에서 filter해야 함). 폴더 작업에서는 손대지 않음.

<!-- 현재 브랜치/작업의 큰 그림 -->
