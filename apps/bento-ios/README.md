# Bento 루틴 (iOS)

맥 Bento 의 루틴 화면을 아이폰으로 옮긴 SwiftUI 앱. 루틴 체크·스트릭·히트맵·주간/월간 분석·타이머,
홈 화면 위젯(바로 체크), 잠금화면·다이내믹 아일랜드 타이머. 도란 서버(`/api/sync/routines/changes`)로
맥 Bento 와 같은 루틴·기록·타이머를 맞춘다.

```
apps/bento-ios/
  project.yml              XcodeGen 원본 (.xcodeproj 는 만들어 쓰고 커밋하지 않는다)
  Packages/RoutineKit/     모델·규칙·통계·동기화 (Foundation 만, swift test 로 시험)
  App/                     앱 (오늘 · 기록 · 루틴 · 설정)
  Widget/                  위젯 · 잠금화면 타이머(Live Activity)
  Shared/                  앱과 위젯이 같이 쓰는 것 (App Group 저장, 색, 인텐트)
  ci/                      GitHub Actions 보조 스크립트
```

## 아이폰에 설치하기 (맥에서)

1. Xcode 16 이상과 XcodeGen 을 준비한다: `brew install xcodegen`
2. `cd apps/bento-ios && xcodegen generate && open BentoRoutine.xcodeproj`
3. 내 계정에 맞춘다 — `project.yml` 의 `settings.base` 세 줄을 고치고 `xcodegen generate` 를 다시 돌리거나,
   Xcode 에서 두 타깃(BentoRoutine, BentoRoutineWidget)의 Signing & Capabilities 를 직접 고친다.
   - `DEVELOPMENT_TEAM`: Xcode › Settings › Accounts 의 팀 ID
   - `BENTO_BUNDLE_PREFIX`: 번들 ID 앞부분. `com.vallista.bento` 가 이미 다른 팀에 잡혀 있으면 바꾼다.
   - `BENTO_APP_GROUP`: 앱과 위젯이 같이 쓰는 저장 폴더(`group.` 으로 시작). 번들 접두어를 바꿨다면 같이 바꾼다.
4. 아이폰을 연결하고 BentoRoutine 스킴으로 실행(⌘R). 처음엔 아이폰 설정 › 일반 › VPN 및 기기 관리에서
   개발자 앱을 신뢰해야 열린다.

무료 Apple 계정(개인 팀)으로 설치한 앱은 7일마다 다시 설치해야 한다. 위젯과 앱이 같은 데이터를 보려면
App Group 이 필요한데, 계정 종류에 따라 Xcode 가 App Group 을 만들지 못하면 위젯이 빈 목록을 보인다
(앱 자체는 동작한다).

## 맥 Bento 와 맞추기

1. 도란 웹 › 계정 › 개인 토큰에서 토큰(`nyt_…`)을 만든다. 맥 Bento 루틴 화면의 '동기화'에 넣은 것과
   같은 계정이면 된다.
2. 앱 › 설정 › 동기화를 켜고 서버(`https://nyanotion.party`)와 토큰을 넣는다. 토큰은 이 기기 키체인에만 둔다.
3. 처음 맞출 때 이 기기 것을 모두 올리고 서버 것을 받아 합친다. 같은 루틴이 양쪽에 있으면 서버 쪽이 남는다.
   이후엔 나중에 고친 쪽이 이긴다.

언제 맞추나: 앱을 열 때, 고친 지 2초 뒤, 앱이 켜져 있으면 1분마다, 아래로 당겨 새로 고침. 위젯에서 체크한 것은
위젯 안에서 파일에만 적히고 앱을 열 때 서버로 올라간다.

## 개발

- `cd Packages/RoutineKit && swift test` — 모델·규칙·통계·동기화 시험 (맥에서)
- CI(`.github/workflows/bento-ios.yml`): `apps/bento-ios` 가 바뀐 push 마다 RoutineKit 형 검사·시험 →
  XcodeGen → 시뮬레이터 빌드(서명 없음). 실패하면 오류 줄이 실행 화면 Annotations 에 모인다.
- 커밋 메시지에 `[shots]` 를 넣으면 디버그 빌드를 예시 데이터(`-BentoDemo`)로 띄워 화면 14장을 찍어
  `ci/bento-ios-shots` 가지에 올린다(한 커밋, 덮어씀). 예시 데이터 코드는 Release 빌드에 들어가지 않고(`#if DEBUG`),
  디버그 빌드에서도 `-BentoDemo` 인자를 줄 때만 쓰인다.
- 시뮬레이터에서 예시 데이터로 보기: 스킴 › Run › Arguments 에 `-BentoDemo` (선택: `-BentoTab stats`).
  예시 데이터는 저장 파일을 덮어쓰니 실기기에서 쓰지 말 것.
