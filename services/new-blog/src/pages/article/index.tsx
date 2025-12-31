import { useState, useEffect, useRef } from 'react'

import { Comments } from '@features/comments'
import { useArticlePage } from '@shared/hooks'
import { ErrorPage } from '@shared/ui/ErrorPage'
import { ArticleHeaderSkeleton } from '@shared/ui/LoadingSkeleton'
import { MarkdownRenderer } from '@shared/ui/MarkdownRenderer'
import { PageWrapper } from '@shared/ui/PageWrapper'
import { RelatedArticles } from '@shared/ui/RelatedArticles'
import { ArticleHeader } from '@widgets/article-header'

import * as styles from './ArticlePage.css'

export function ArticlePage() {
  const { article, relatedArticles, seriesInfo, seoData, isLoading, error, hasArticle, hasRelatedArticles } =
    useArticlePage()
  const [imageLoaded, setImageLoaded] = useState(false)
  const imageRef = useRef<HTMLImageElement>(null)

  // 아티클이 변경될 때마다 이미지 로드 상태 리셋 및 확인
  useEffect(() => {
    setImageLoaded(false)

    // 이미지가 이미 로드되어 있는지 확인 (캐시된 경우)
    // 약간의 지연을 두어 DOM 렌더링 후 확인
    const checkImageLoaded = () => {
      if (imageRef.current?.complete && imageRef.current.naturalHeight !== 0) {
        setImageLoaded(true)
      }
    }

    // 즉시 확인
    checkImageLoaded()

    // 다음 틱에서도 확인 (DOM 업데이트 후)
    const timeoutId = setTimeout(checkImageLoaded, 0)

    return () => clearTimeout(timeoutId)
  }, [article?.slug, article?.image])

  if (isLoading) {
    return (
      <PageWrapper title='로딩 중...' description='글을 불러오는 중입니다.' enableScrollToTop={false}>
        <ArticleHeaderSkeleton />
      </PageWrapper>
    )
  }

  if (error || !hasArticle) {
    return (
      <ErrorPage
        title='글을 찾을 수 없습니다'
        description='요청하신 글을 찾을 수 없습니다.'
        message='글을 찾을 수 없습니다.'
        className={styles.errorContainer}
      />
    )
  }

  return (
    <PageWrapper title={article!.title} description={article!.description} seoData={seoData} className={styles.wrapper}>
      <article className={styles.article}>
        {/* 아티클 헤더 */}
        <ArticleHeader article={article!} series={seriesInfo || undefined} />

        {/* 썸네일 이미지 */}
        {article!.image && (
          <div className={styles.thumbnailContainer}>
            <img
              ref={imageRef}
              src={article!.image}
              alt={article!.title}
              className={`${styles.thumbnailImage} ${imageLoaded ? styles.thumbnailImageLoaded : ''}`}
              width={800}
              height={400}
              loading='eager'
              decoding='async'
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageLoaded(true)} // 에러 발생 시에도 표시 (빈 공간 방지)
            />
          </div>
        )}

        {/* 본문 */}
        <div className={styles.contentContainer}>
          <MarkdownRenderer content={article!.content} articleSlug={article!.slug} />
        </div>

        {/* 댓글 */}
        <div className={styles.commentsContainer}>
          <Comments postId={article!.slug} title={article!.title} />
        </div>

        {/* 관련 글 */}
        {hasRelatedArticles && <RelatedArticles articles={relatedArticles} className={styles.relatedSection} />}
      </article>
    </PageWrapper>
  )
}
