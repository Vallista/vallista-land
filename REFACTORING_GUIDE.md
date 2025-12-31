# 코드 리팩토링 가이드

## 📋 좋은 코드의 원칙

### 1. **타입 안전성 (Type Safety)**
- `any` 타입 사용 금지
- 명시적 타입 정의
- 제네릭 활용으로 재사용성 향상

### 2. **단일 책임 원칙 (Single Responsibility Principle)**
- 함수/컴포넌트는 하나의 책임만 가져야 함
- 긴 함수는 작은 단위로 분리

### 3. **DRY (Don't Repeat Yourself)**
- 중복 코드 제거
- 공통 로직은 유틸리티/훅으로 추출

### 4. **에러 처리 일관성**
- 일관된 에러 처리 패턴
- 명확한 에러 메시지
- 프로덕션 코드에서 console.log 제거

### 5. **성능 최적화**
- 불필요한 리렌더링 방지 (useMemo, useCallback)
- 적절한 의존성 배열 관리
- 메모이제이션 전략 수립

### 6. **가독성 (Readability)**
- 명확한 변수/함수명
- 매직 넘버/문자열을 상수로 추출
- 적절한 주석 (왜를 설명)

### 7. **테스트 가능성 (Testability)**
- 순수 함수 지향
- 사이드 이펙트 최소화
- 의존성 주입 가능한 구조

---

## 🔍 발견된 문제점 및 개선 사항

### 🔴 **심각 (Critical)**

#### 1. **프로덕션 코드에 console.log 남아있음**
**위치:**
- `services/new-blog/src/shared/hooks/useThemeSwitch.ts` (7개)
- `services/new-blog/src/shared/lib/content.ts` (2개)
- `services/new-blog/src/features/comments/GiscusComments.tsx` (4개)
- `packages/design-system/src/components/ThemeProvider/ThemeProvider.tsx` (3개)

**문제:**
- 프로덕션 빌드에 불필요한 로그 포함
- 성능 저하 및 보안 이슈 가능성

**개선 방안:**
```typescript
// 환경별 로깅 유틸리티 생성
// shared/lib/logger.ts
export const logger = {
  log: (...args: unknown[]) => {
    if (import.meta.env.DEV) {
      console.log(...args)
    }
  },
  warn: (...args: unknown[]) => {
    if (import.meta.env.DEV) {
      console.warn(...args)
    }
  },
  error: (...args: unknown[]) => {
    // 에러는 항상 로깅
    console.error(...args)
  }
}
```

#### 2. **any 타입 사용**
**위치:**
- `services/new-blog/src/shared/ui/MarkdownRenderer/index.tsx:21`
- `services/new-blog/src/shared/ui/Sidebar/SidebarContent.tsx:11`
- `services/new-blog/src/shared/lib/content.ts:262, 267`

**문제:**
- 타입 안전성 저하
- 런타임 에러 가능성 증가

**개선 방안:**
```typescript
// MarkdownRenderer/index.tsx
import { CodeProps } from 'react-markdown'

code({ node: _node, inline, className, children, ...props }: CodeProps) {
  // ...
}

// SidebarContent.tsx
export interface SidebarContentProps {
  selectedCategory: string
  contents: ArticleMeta[] // any[] 대신 명시적 타입
}

// content.ts
interface ArticleWithSeries extends ArticleMeta {
  series?: {
    name: string
    order: number
  }
}
```

#### 3. **코드 중복: processImagePath와 optimizeImagePath**
**위치:** `services/new-blog/src/shared/lib/content.ts:21-98`

**문제:**
- 거의 동일한 로직이 두 함수에 중복
- 유지보수 어려움

**개선 방안:**
```typescript
// 공통 로직 추출
function normalizeImagePath(imagePath: string, slug: string): string {
  if (!imagePath) return ''
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  // ... 공통 로직
}

export function processImagePath(imagePath: string | undefined, slug: string): string | undefined {
  if (!imagePath) return undefined
  return normalizeImagePath(imagePath, slug)
}

export function optimizeImagePath(imagePath: string | undefined, slug: string): string | undefined {
  if (!imagePath) return undefined
  // optimizeImagePath만의 추가 로직이 있다면 여기에
  return normalizeImagePath(imagePath, slug)
}
```

---

### 🟡 **중요 (Important)**

#### 4. **에러 처리 일관성 부족**
**위치:**
- `services/new-blog/src/shared/lib/content.ts`
- `services/new-blog/src/shared/hooks/useLocalStorage.ts`

**문제:**
- 에러 처리 방식이 일관되지 않음
- 일부는 빈 배열 반환, 일부는 null 반환

**개선 방안:**
```typescript
// 공통 에러 타입 정의
export class ContentError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'ContentError'
  }
}

// 일관된 에러 처리
export async function loadAllContent(): Promise<ContentIndex> {
  try {
    // ...
  } catch (error) {
    logger.error('Error loading content index:', error)
    throw new ContentError('Failed to load content', 'LOAD_ERROR')
  }
}
```

#### 5. **성능 최적화 기회**
**위치:**
- `services/new-blog/src/shared/ui/Sidebar/SidebarContent.tsx:26-28`
- `services/new-blog/src/shared/hooks/useCategory.ts`

**문제:**
- 필터링 로직이 매 렌더링마다 실행
- useMemo 미활용

**개선 방안:**
```typescript
// SidebarContent.tsx
const filteredContents = useMemo(() => {
  return contents.filter(
    (content) => content.draft !== true && content.title.toLowerCase().includes(search.toLowerCase())
  )
}, [contents, search])

// useCategory.ts는 이미 useMemo 사용 중 (좋음)
```

#### 6. **매직 넘버/문자열**
**위치:**
- `services/new-blog/src/shared/lib/content.ts:160` (maxLength)
- `services/new-blog/src/shared/lib/utils.ts:14` (wordsPerMinute)
- `services/new-blog/src/shared/hooks/useThemeSwitch.ts:24-25` (색상 값)

**개선 방안:**
```typescript
// constants/content.ts
export const CONTENT_CONSTANTS = {
  WORDS_PER_MINUTE: 200,
  DESCRIPTION_MAX_LENGTH: 160,
  RELATED_ARTICLES_LIMIT: 3
} as const

// constants/theme.ts
export const THEME_COLORS = {
  DARK_BACKGROUND: '#000000',
  DARK_STATUS_BAR: 'black-translucent',
  LIGHT_BACKGROUND: '#ffffff',
  LIGHT_STATUS_BAR: 'default'
} as const
```

#### 7. **긴 함수 분리 필요**
**위치:**
- `services/new-blog/src/shared/hooks/useThemeSwitch.ts:16-77` (updateIOSMetaTags)
- `packages/design-system/src/components/ThemeProvider/ThemeProvider.tsx:98-151` (useLayoutEffect)

**개선 방안:**
```typescript
// useThemeSwitch.ts
// updateIOSMetaTags를 별도 유틸리티로 분리
// shared/lib/iosMetaTags.ts
export function updateThemeColorMeta(theme: 'LIGHT' | 'DARK'): void {
  // theme-color 업데이트 로직
}

export function updateStatusBarMeta(theme: 'LIGHT' | 'DARK'): void {
  // status-bar 업데이트 로직
}

export function updateIOSMetaTags(theme: 'LIGHT' | 'DARK'): void {
  updateThemeColorMeta(theme)
  updateStatusBarMeta(theme)
  // 리플로우 로직
}
```

#### 8. **타입 정의 중복**
**위치:**
- `services/new-blog/src/shared/lib/content.ts:4-18`
- `services/new-blog/src/shared/types/index.ts`

**개선 방안:**
- ContentFile, ContentIndex 타입을 `shared/types/index.ts`로 이동
- 중앙 집중식 타입 관리

---

### 🟢 **개선 권장 (Nice to Have)**

#### 9. **컴포넌트 props 타입 일관성**
**위치:**
- 일부 컴포넌트는 interface, 일부는 type 사용

**개선 방안:**
- 프로젝트 전반에 걸쳐 일관된 타입 정의 방식 선택 (interface 권장)

#### 10. **주석 처리된 코드 제거**
**위치:**
- `packages/design-system/src/hooks/useControlledState/index.tsx:41`

**개선 방안:**
- 주석 처리된 코드는 Git 히스토리로 관리하고 제거

#### 11. **경로 별칭 일관성**
**위치:**
- `@/assets/icons/...` vs `@shared/...`

**개선 방안:**
- 프로젝트 전반에 걸쳐 경로 별칭 규칙 통일

#### 12. **에러 바운더리 추가**
**위치:**
- 전역 에러 처리 부재

**개선 방안:**
```typescript
// app/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component {
  // 에러 바운더리 구현
}
```

---

## 📊 우선순위별 개선 계획

### Phase 1: 즉시 수정 (Critical)
1. ✅ console.log 제거 및 로거 유틸리티 도입
2. ✅ any 타입 제거 및 명시적 타입 정의
3. ✅ 코드 중복 제거 (processImagePath)

### Phase 2: 단기 개선 (Important)
4. ✅ 에러 처리 일관성 확보
5. ✅ 성능 최적화 (useMemo, useCallback)
6. ✅ 매직 넘버/문자열 상수화
7. ✅ 긴 함수 분리

### Phase 3: 장기 개선 (Nice to Have)
8. ✅ 타입 정의 중앙화
9. ✅ 컴포넌트 props 타입 일관성
10. ✅ 경로 별칭 통일
11. ✅ 에러 바운더리 추가

---

## 🛠️ 리팩토링 체크리스트

각 파일 수정 시 확인 사항:

- [ ] `any` 타입이 없는가?
- [ ] `console.log`가 제거되었는가? (개발 환경 제외)
- [ ] 에러 처리가 일관된가?
- [ ] 불필요한 리렌더링이 없는가? (useMemo, useCallback 활용)
- [ ] 매직 넘버/문자열이 상수로 추출되었는가?
- [ ] 함수가 단일 책임을 가지는가?
- [ ] 타입이 명시적으로 정의되었는가?
- [ ] 중복 코드가 제거되었는가?
- [ ] 주석이 "왜"를 설명하는가? (코드 자체가 "무엇"을 설명)
- [ ] 테스트 가능한 구조인가?

---

## 📝 참고 자료

- [TypeScript Best Practices](https://typescript-eslint.io/rules/)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [Clean Code Principles](https://github.com/ryanmcdermott/clean-code-javascript)

