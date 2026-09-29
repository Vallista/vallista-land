# Bento

개인 라이프 OS — macOS 전용 데스크톱 앱.  
글·메모·계획·RSS·인사이트를 하나의 창으로 관리합니다.

## 화면 구성

| 화면 | 설명 |
|------|------|
| Today | 오늘 일정·할 일·기분 기록 |
| Plan | 주간 캘린더 + 타임블로킹 |
| Thoughts | 마크다운 메모 |
| Atelier | 블로그 글 에디터 (콘텐츠 폴더 연결 시 활성화) |
| Publish | 블로그 발행 (Git 연동) |
| Glean | RSS·Threads 수집 및 하이라이트 |
| Insights | 문서 그래프·태그·인사이트 분석 |
| LLM Setup | 로컬 LLM 서버 설치·실행 |

## 요구사항

- macOS 12 이상
- [Rust](https://rustup.rs) (stable)
- Node.js 18 이상 + [pnpm](https://pnpm.io)

## 개발 환경 설정

```sh
# 저장소 루트에서
pnpm install

# Tauri CLI
cargo install tauri-cli --version "^2"
```

## 실행

```sh
# 저장소 루트에서 실행
pnpm --filter @vallista/admin tauri dev
```

또는 `apps/admin/` 디렉터리 내에서:

```sh
cargo tauri dev
```

## 빌드

```sh
# 저장소 루트에서
pnpm --filter @vallista/admin tauri build
```

빌드 결과물은 `apps/admin/src-tauri/target/release/bundle/` 에 생성됩니다.

## 첫 실행 — 온보딩

앱을 처음 실행하면 5단계 설정 마법사가 자동으로 열립니다.

1. **앱 이름 · URL** — 앱 표시 이름과 사이트 주소 (선택)
2. **콘텐츠 폴더** — 로컬 글·메모 폴더 연결 여부 선택 후 폴더 선택
3. **컬렉션 경로** — 글/메모의 하위 폴더 경로 지정 (콘텐츠 폴더 연결 시)
4. **권한** — macOS 캘린더 접근 허용
5. **요약** — 설정 확인 후 시작

온보딩을 다시 실행하려면 브라우저 DevTools 콘솔에서:

```js
localStorage.removeItem('bento.onboarding.done'); location.reload();
```

## 리브랜딩 (포크 후 자신의 앱으로 배포할 때)

런타임 설정(앱 이름, URL 등)은 온보딩에서 변경할 수 있습니다.  
macOS 번들 ID와 같은 빌드 시 식별자는 아래 두 파일을 직접 편집해야 합니다.

**`apps/admin/src-tauri/tauri.conf.json`**
```json
{
  "productName": "YourAppName",
  "identifier": "com.yourname.yourapp"
}
```

**`apps/admin/src-tauri/Cargo.toml`**
```toml
[package]
name = "your-app-name"
```

## 기술 스택

- [Tauri v2](https://v2.tauri.app) — Rust 백엔드 + 웹뷰 프론트엔드
- React + TypeScript
- SQLite (rusqlite, bundled)
- macOS EventKit (캘린더 연동)
