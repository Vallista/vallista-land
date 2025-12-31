import { Text, Spinner , Container } from '@vallista/design-system'

interface LoadingStateProps {
  message?: string
  size?: number
}

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

interface EmptyStateProps {
  message: string
}

/**
 * 로딩 상태 컴포넌트
 */
export function LoadingState({ message = '로딩 중...', size = 48 }: LoadingStateProps) {
  return (
    <Container>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '32px 0' }}>
        <Spinner size={size} />
        <Text color='secondary'>{message}</Text>
      </div>
    </Container>
  )
}

/**
 * 에러 상태 컴포넌트
 */
export function ErrorState({ message = '오류가 발생했습니다.', onRetry }: ErrorStateProps) {
  return (
    <Container>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '32px 0' }}>
        <Text color='error'>{message}</Text>
        {onRetry && (
          <button onClick={onRetry} style={{ padding: '8px 16px', cursor: 'pointer' }}>
            다시 시도
          </button>
        )}
      </div>
    </Container>
  )
}

/**
 * 빈 상태 컴포넌트
 */
export function EmptyState({ message }: EmptyStateProps) {
  return (
    <Container>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
        <Text color='secondary'>{message}</Text>
      </div>
    </Container>
  )
}
