import { PageWrapperProps } from '@shared/types'
import { usePageScroll, useSEO } from '@shared/hooks'
import { SEOHead } from '@shared/ui/SEOHead'
import { PageContent } from '@shared/ui/PageContent'

/**
 * 페이지 래퍼 컴포넌트
 * 모든 페이지의 공통 기능을 제공합니다:
 * - SEO 메타데이터 설정
 * - 페이지 상단으로 스크롤
 * - 공통 레이아웃 구조
 */
export function PageWrapper({
  title,
  description,
  children,
  seoData,
  enableScrollToTop = true,
  className
}: PageWrapperProps) {
  // SEO 데이터 생성
  const defaultSEO = useSEO({ title, description })
  const finalSEO = seoData || defaultSEO

  // 페이지 스크롤 처리
  usePageScroll({ enabled: enableScrollToTop })

  return (
    <>
      <SEOHead seoData={finalSEO} />
      <PageContent className={className}>{children}</PageContent>
    </>
  )
}
