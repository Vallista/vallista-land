import { useArticlePage } from '@shared/hooks'
import { PageWrapper } from '@shared/ui/PageWrapper'
import { MarkdownRenderer } from '@shared/ui/MarkdownRenderer'
import { Comments } from '@features/comments'
import { ArticleHeader } from '@widgets/article-header'
import { ArticleHeaderSkeleton } from '@shared/ui/LoadingSkeleton'
import { ErrorPage } from '@shared/ui/ErrorPage'
import { RelatedArticles } from '@shared/ui/RelatedArticles'
import * as styles from './ArticlePage.css'

export function ArticlePage() {
  const { article, relatedArticles, seriesInfo, seoData, isLoading, error, hasArticle, hasRelatedArticles } =
    useArticlePage()

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
            <img src={article!.image} alt={article!.title} className={styles.thumbnailImage} />
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
