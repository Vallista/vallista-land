# Giscus 설정 가이드

Giscus는 GitHub Discussions를 기반으로 한 댓글 시스템입니다. 이 가이드에서는 Giscus를 설정하는 방법을 설명합니다.

## 1. GitHub 저장소 설정

### 1.1 Discussions 활성화
1. GitHub 저장소로 이동
2. Settings > Features
3. "Discussions" 체크박스 활성화
4. "Save changes" 클릭

### 1.2 Discussions 카테고리 생성
1. 저장소의 "Discussions" 탭으로 이동
2. "New discussion" 클릭
3. 카테고리 선택 (예: "Announcements")
4. 테스트 글 작성 후 저장

## 2. Giscus 설정

### 2.1 giscus.app 방문
1. [giscus.app](https://giscus.app/) 접속
2. GitHub 계정으로 로그인

### 2.2 저장소 선택
1. "Repository" 드롭다운에서 저장소 선택
2. "vallista/vallista-land" 선택

### 2.3 Discussions 카테고리 선택
1. "Discussion category" 드롭다운에서 카테고리 선택
2. "Announcements" 선택

### 2.4 매핑 설정
- **Mapping**: `pathname` (URL 경로 기반)
- **Discussion term**: `pathname` (기본값)

### 2.5 기능 설정
- **Strict**: `0` (비활성화)
- **Reactions enabled**: `1` (활성화)
- **Emit metadata**: `0` (비활성화)
- **Input position**: `bottom` (하단)
- **Theme**: `preferred_color_scheme` (시스템 설정 따름)
- **Language**: `ko` (한국어)

## 3. 설정 파일 업데이트

`src/shared/config/giscus.ts` 파일에서 다음 정보를 업데이트하세요:

```typescript
export const GISCUS_CONFIG = {
  repo: 'vallista/vallista-land', // 실제 저장소명
  repoId: 'R_kgDOJqXqXQ', // giscus.app에서 제공하는 ID
  category: 'Announcements', // Discussions 카테고리명
  categoryId: 'DIC_kwDOJqXqXc4CbqXq', // giscus.app에서 제공하는 ID
  // ... 기타 설정
}
```

## 4. 테스트

1. 개발 서버 실행: `pnpm dev:new-blog`
2. 글 페이지로 이동
3. 댓글 섹션에서 Giscus가 정상적으로 로드되는지 확인
4. GitHub 계정으로 로그인하여 댓글 작성 테스트

## 5. 문제 해결

### 5.1 댓글이 표시되지 않는 경우
- Discussions가 활성화되어 있는지 확인
- 카테고리가 올바르게 설정되어 있는지 확인
- 저장소 ID와 카테고리 ID가 정확한지 확인

### 5.2 로그인 문제
- GitHub 계정이 저장소에 접근 권한이 있는지 확인
- 브라우저에서 쿠키가 활성화되어 있는지 확인

### 5.3 테마 문제
- `theme` 설정을 `light` 또는 `dark`로 변경하여 테스트
- CSS 커스터마이징이 필요하면 `GiscusComments.css.ts` 수정

## 6. 고급 설정

### 6.1 다국어 지원
```typescript
lang: 'ko', // 한국어
// 'en' (영어), 'ja' (일본어) 등 지원
```

### 6.2 커스텀 테마
```typescript
theme: 'light', // 고정 라이트 테마
// 'dark' (고정 다크 테마)
// 'preferred_color_scheme' (시스템 설정 따름)
```

### 6.3 매핑 방식 변경
```typescript
mapping: 'title', // 제목 기반 매핑
// 'pathname' (URL 경로 기반)
// 'url' (전체 URL 기반)
// 'og:title' (Open Graph 제목 기반)
```

## 7. 보안 고려사항

- Giscus는 GitHub OAuth를 사용하므로 안전합니다
- 사용자 데이터는 GitHub Discussions에 저장됩니다
- 스팸 방지는 GitHub의 기본 기능을 사용합니다

## 8. 성능 최적화

- `loading: 'lazy'` 설정으로 지연 로딩
- iframe이 로드될 때까지 로딩 스피너 표시
- 컴포넌트 언마운트 시 정리 작업 수행
