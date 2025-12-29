import { useParams } from 'react-router-dom'
import { loadArticle, getRelatedArticles, getSeriesInfo } from '@shared/lib/content'
import { usePageQuery, useSEO, usePageScroll } from '@shared/hooks'
import { Article, Series, ArticleMeta } from '@shared/types'

interface UseArticlePageOptions {
  enableScrollToTop?: boolean
}

/**
 * 아티클 페이지 전용 훅
 * 아티클 로딩, 관련 글, 시리즈 정보 등을 관리합니다.
 */
export function useArticlePage(options: UseArticlePageOptions = {}) {
  const { enableScrollToTop = true } = options
  const { slug } = useParams<{ slug: string }>()

  // 페이지 스크롤 처리
  usePageScroll({ enabled: enableScrollToTop, dependencies: [slug] })

  // 아티클 로딩
  const {
    data: article,
    isLoading: isArticleLoading,
    error: articleError
  } = usePageQuery<Article | null>(['article', slug], () => loadArticle(slug!), { enabled: !!slug })

  // 관련 글 로딩
  const { data: relatedArticles } = usePageQuery<ArticleMeta[]>(
    ['related-articles', slug],
    () => getRelatedArticles(slug!),
    { enabled: !!slug && !!article }
  )

  // 시리즈 정보 로딩
  const { data: seriesInfo } = usePageQuery<Series | null>(
    ['series-info', article?.series?.name],
    () => getSeriesInfo(article!.series!.name),
    { enabled: !!article?.series?.name }
  )

  // SEO 데이터 생성
  const seoData = useSEO({ article: article || undefined })

  return {
    slug,
    article,
    relatedArticles: (relatedArticles || []) as ArticleMeta[],
    seriesInfo,
    seoData,
    isLoading: isArticleLoading,
    error: articleError,
    hasArticle: !!article,
    hasRelatedArticles: !!(relatedArticles && relatedArticles.length > 0)
  }
}
