import { Container } from '@vallista/design-system'
import { PageContentProps } from '@shared/types'

/**
 * 페이지 콘텐츠 래퍼 컴포넌트
 * 페이지의 메인 콘텐츠를 감싸는 컨테이너입니다.
 */
export function PageContent({ children, className }: PageContentProps) {
  return <Container className={className}>{children}</Container>
}
