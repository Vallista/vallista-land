import { ContentPageProps } from '@shared/types'
import { PageWrapper } from '@shared/ui/PageWrapper'
import { LoadingState, ErrorState, EmptyState } from '@shared/ui/PageStates'

/**
 * 콘텐츠 페이지 컴포넌트
 * 로딩, 에러, 빈 상태를 자동으로 처리하는 콘텐츠 페이지입니다.
 */
export function ContentPage({
  title,
  description,
  content,
  isLoading,
  error,
  emptyMessage,
  children,
  className,
  enableScrollToTop = true
}: ContentPageProps) {
  // 로딩 상태
  if (isLoading) {
    return (
      <PageWrapper title={title} description={description} enableScrollToTop={enableScrollToTop} className={className}>
        <LoadingState message='글을 불러오는 중...' />
      </PageWrapper>
    )
  }

  // 에러 상태
  if (error) {
    return (
      <PageWrapper title={title} description={description} enableScrollToTop={enableScrollToTop} className={className}>
        <ErrorState message='글을 불러오는 중 오류가 발생했습니다.' />
      </PageWrapper>
    )
  }

  // 빈 상태
  if (!content || content.length === 0) {
    return (
      <PageWrapper title={title} description={description} enableScrollToTop={enableScrollToTop} className={className}>
        <EmptyState message={emptyMessage || '아직 글이 없습니다. 곧 새로운 글을 작성할 예정입니다.'} />
      </PageWrapper>
    )
  }

  // 정상 상태
  return (
    <PageWrapper title={title} description={description} enableScrollToTop={enableScrollToTop} className={className}>
      {children}
    </PageWrapper>
  )
}
