import { Text } from '@vallista/design-system'
import { Link } from 'react-router-dom'
import { PageWrapper } from '@shared/ui/PageWrapper'

interface ErrorPageProps {
  title?: string
  description?: string
  message?: string
  showHomeLink?: boolean
  className?: string
}

/**
 * 에러 페이지 컴포넌트
 * 페이지별 에러 상태를 일관되게 처리합니다.
 */
export function ErrorPage({
  title = '오류가 발생했습니다',
  description = '요청하신 페이지를 처리하는 중 오류가 발생했습니다.',
  message = '잠시 후 다시 시도해주세요.',
  showHomeLink = true,
  className
}: ErrorPageProps) {
  return (
    <PageWrapper title={title} description={description} enableScrollToTop={false}>
      <div className={className}>
        <Text color='error'>{message}</Text>
        {showHomeLink && (
          <div style={{ marginTop: '16px' }}>
            <Link to='/'>홈으로 돌아가기</Link>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
