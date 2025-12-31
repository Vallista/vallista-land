import { Component, ReactNode } from 'react'

import { logger } from '@shared/lib/logger'
import { ErrorPage } from '@shared/ui/ErrorPage'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * 에러 바운더리 컴포넌트
 * 하위 컴포넌트 트리에서 발생한 에러를 캐치하여 처리합니다.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // 다음 렌더에서 폴백 UI가 보이도록 상태를 업데이트합니다.
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 에러를 로깅합니다.
    logger.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      // 커스텀 폴백 UI가 있으면 사용하고, 없으면 기본 에러 페이지를 표시합니다.
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <ErrorPage
          title='오류가 발생했습니다'
          description='애플리케이션에서 예기치 않은 오류가 발생했습니다.'
          message={this.state.error?.message || '알 수 없는 오류가 발생했습니다.'}
          showHomeLink={true}
        />
      )
    }

    return this.props.children
  }
}

