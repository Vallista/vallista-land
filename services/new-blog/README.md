# Vallista Blog v4

새로운 기술 스택으로 구축된 Vallista의 기술 블로그입니다.

## 🚀 기술 스택

### **핵심 기술**

- **React 19** - 최신 React 기능 활용
- **TypeScript 5.4+** - 타입 안전성
- **Vite 6** - 빠른 개발 환경
- **Vanilla Extract** - 타입 안전한 CSS-in-JS
- **React Router v7** - 최신 라우팅
- **TanStack Query v5** - 서버 상태 관리
- **Zustand** - 클라이언트 상태 관리

### **아키텍처**

- **FSD (Feature-Sliced Design)** - 확장 가능한 폴더 구조
- **CSR + Hydration** - 클라이언트 사이드 렌더링
- **SEO 최적화** - 정적 페이지 생성

### **개발 도구**

- **ESLint + Prettier** - 코드 품질
- **Vitest** - 테스팅
- **PWA** - Progressive Web App

## 📁 프로젝트 구조

```
src/
├── app/                 # 앱 레벨 설정
│   ├── providers/       # 전역 프로바이더
│   ├── styles/          # 전역 스타일
│   └── assets/          # 정적 자산
├── pages/               # 페이지 컴포넌트
├── widgets/             # 위젯 컴포넌트
├── features/            # 기능별 컴포넌트
├── entities/            # 도메인 엔티티
└── shared/              # 공통 모듈
    ├── ui/              # UI 컴포넌트
    ├── lib/             # 유틸리티
    ├── hooks/           # 커스텀 훅
    ├── api/             # API 관련
    ├── config/          # 설정
    └── types/           # 타입 정의
```

## 🛠️ 개발 환경 설정

### **필수 요구사항**

- Node.js 18+
- pnpm 8+

### **설치 및 실행**

```bash
# 의존성 설치
pnpm install

# 개발 서버 실행
pnpm dev

# 빌드
pnpm build

# 타입 체크
pnpm type-check

# 린트
pnpm lint

# 테스트
pnpm test
```

## 📝 컨텐츠 관리

### **글 작성**

1. `contents/articles/` 디렉토리에 새 폴더 생성
2. `index.md` 파일에 마크다운으로 글 작성
3. Frontmatter에 메타데이터 추가

```markdown
---
title: 글 제목
description: 글 설명
date: 2024-01-01
tags: [태그1, 태그2]
image: ./assets/image.png
slug: custom-slug
---
```

### **이미지 관리**

- 각 글 폴더 내 `assets/` 디렉토리에 이미지 저장
- 상대 경로로 참조: `![설명](./assets/image.png)`

## 🚀 배포

### **SEO 생성**

```bash
pnpm generate-seo
```

### **배포**

```bash
pnpm deploy
```

## 🔧 주요 기능

### **SEO 최적화**

- 자동 sitemap.xml 생성
- robots.txt 생성
- RSS 피드 생성
- Open Graph 메타태그
- Twitter Card 지원

### **성능 최적화**

- 코드 스플리팅
- 이미지 최적화
- PWA 지원
- 캐싱 전략

### **개발자 경험**

- Hot Module Replacement
- 타입 안전성
- 자동 린팅
- 테스트 환경

## 📚 추가 문서

- [기술 스택 상세](./docs/tech-stack.md)
- [컴포넌트 가이드](./docs/components.md)
- [스타일 가이드](./docs/styling.md)
- [배포 가이드](./docs/deployment.md)

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 라이선스

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
