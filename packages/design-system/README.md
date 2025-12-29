# Vallista Design System

Vallista Design System은 React 기반의 모던한 디자인 시스템입니다.

## 설치

```bash
npm install @vallista/design-system
# 또는
yarn add @vallista/design-system
# 또는
pnpm add @vallista/design-system
```

## 사용법

### 전체 라이브러리 사용

```tsx
import { Button, Badge, Text } from '@vallista/design-system'

function App() {
  return (
    <div>
      <Button size='medium' color='primary'>
        Click me
      </Button>
      <Badge type='success' variant='contrast'>
        150
      </Badge>
      <Text size={16} weight={500}>
        Hello World
      </Text>
    </div>
  )
}
```

### 개별 컴포넌트 사용 (Tree Shaking)

```tsx
// 전체 라이브러리를 import하지 않고 필요한 컴포넌트만 import
import { Button } from '@vallista/design-system/Button'
import { Badge } from '@vallista/design-system/Badge'
import { Text } from '@vallista/design-system/Text'

function App() {
  return (
    <div>
      <Button size='medium' color='primary'>
        Click me
      </Button>
      <Badge type='success' variant='contrast'>
        150
      </Badge>
      <Text size={16} weight={500}>
        Hello World
      </Text>
    </div>
  )
}
```

### Hooks 사용

```tsx
import { useModal, useUniqueId } from '@vallista/design-system/hooks'

function MyComponent() {
  const { active, open, close } = useModal()
  const uniqueId = useUniqueId()

  return (
    <div>
      <button onClick={open}>Open Modal</button>
      {active && (
        <div>
          <h2>Modal Content</h2>
          <button onClick={close}>Close</button>
        </div>
      )}
    </div>
  )
}
```

### Theme 사용

```tsx
import { ThemeProvider } from '@vallista/design-system/ThemeProvider'
import { COLOR_TOKENS } from '@vallista/design-system/theme'

function App() {
  return (
    <ThemeProvider theme='LIGHT'>
      <div style={{ backgroundColor: COLOR_TOKENS.PRIMARY.WHITE }}>
        <h1>Light Theme</h1>
      </div>
    </ThemeProvider>
  )
}
```

### Utils 사용

```tsx
import { copy } from '@vallista/design-system/utils'

function CopyButton({ text }: { text: string }) {
  const handleCopy = () => {
    copy(
      text,
      () => console.log('복사 성공!'),
      () => console.log('복사 실패!')
    )
  }

  return <button onClick={handleCopy}>Copy Text</button>
}
```

## 사용 가능한 컴포넌트

### UI Components

- `Badge` - 뱃지 컴포넌트
- `Button` - 버튼 컴포넌트
- `Capacity` - 용량 표시 컴포넌트
- `Checkbox` - 체크박스 컴포넌트
- `Collapse` - 접을 수 있는 패널 컴포넌트
- `Container` - 컨테이너 컴포넌트
- `Footer` - 푸터 컴포넌트
- `Icon` - 아이콘 컴포넌트
- `Image` - 이미지 컴포넌트
- `Input` - 입력 필드 컴포넌트
- `LoadingDots` - 로딩 애니메이션 컴포넌트
- `Modal` - 모달 컴포넌트
- `Note` - 노트 컴포넌트
- `Progress` - 진행률 표시 컴포넌트
- `Radio` - 라디오 버튼 컴포넌트
- `Select` - 선택 컴포넌트
- `ShowMore` - 더보기 컴포넌트
- `Snippet` - 코드 스니펫 컴포넌트
- `Spacer` - 간격 컴포넌트
- `Spinner` - 스피너 컴포넌트
- `Switch` - 스위치 컴포넌트
- `Tabs` - 탭 컴포넌트
- `Tag` - 태그 컴포넌트
- `Tags` - 태그 그룹 컴포넌트
- `Text` - 텍스트 컴포넌트
- `ThemeProvider` - 테마 제공자 컴포넌트
- `Toast` - 토스트 알림 컴포넌트
- `Toggle` - 토글 컴포넌트
- `Tooltip` - 툴팁 컴포넌트
- `Video` - 비디오 플레이어 컴포넌트

### Hooks

- `useControlledState` - 제어/비제어 상태 관리
- `useDebounce` - 디바운스 훅
- `useModal` - 모달 상태 관리
- `useRect` - 요소 크기 및 위치 정보
- `useUniqueId` - 고유 ID 생성
- `useWindowSize` - 윈도우 크기 감지

### Utils

- `copy` - 클립보드 복사
- `createUniqueId` - 고유 ID 생성
- `createContext` - 컨텍스트 생성 유틸리티
- `math` - 수학 유틸리티 함수들

## TypeScript 지원

이 라이브러리는 TypeScript로 작성되었으며 완전한 타입 정의를 제공합니다.

```tsx
import { Button, ButtonProps } from '@vallista/design-system'

// 타입 안전성 보장
const buttonProps: ButtonProps = {
  size: 'medium',
  color: 'primary',
  children: 'Click me'
}

<Button {...buttonProps} />
```

## 빌드 결과물

빌드 후 `dist` 폴더에는 다음 구조로 파일들이 생성됩니다:

```
dist/
├── index.js                    # 전체 라이브러리 번들
├── index.d.ts                  # 전체 타입 정의
├── design-system.css           # CSS 번들
├── Badge/
│   ├── index.js               # Badge 컴포넌트 번들
│   └── index.d.ts             # Badge 타입 정의
├── Button/
│   ├── index.js               # Button 컴포넌트 번들
│   └── index.d.ts             # Button 타입 정의
├── hooks/
│   ├── index.js               # Hooks 모듈
│   └── index.d.ts             # Hooks 타입 정의
├── theme/
│   ├── index.js               # Theme 모듈
│   └── index.d.ts             # Theme 타입 정의
├── utils/
│   ├── index.js               # Utils 모듈
│   └── index.d.ts             # Utils 타입 정의
└── ... (모든 컴포넌트에 대해 동일한 구조)
```

## 개발

```bash
# 의존성 설치
pnpm install

# 개발 모드 (watch)
pnpm dev

# 빌드
pnpm build

# 타입 체크
pnpm type-check

# 스토리북 실행
pnpm storybook
```

## 라이선스

MIT License
