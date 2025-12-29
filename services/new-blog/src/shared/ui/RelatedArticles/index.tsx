import { Spacer } from '@vallista/design-system'
import { Heading } from '@shared/ui/Heading'
import { ArticleCard } from '@widgets/article-card'
import { ArticleMeta } from '@shared/types'

interface RelatedArticlesProps {
  articles: ArticleMeta[]
  className?: string
}

/**
 * 관련 글 섹션 컴포넌트
 * 아티클 페이지에서 관련 글을 표시하는 재사용 가능한 컴포넌트입니다.
 */
export function RelatedArticles({ articles, className }: RelatedArticlesProps) {
  if (!articles || articles.length === 0) {
    return null
  }

  return (
    <section className={className}>
      <Heading as='h2' size='xl'>
        관련 글
      </Heading>
      <Spacer y={4} />
      <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        {articles.map((article) => (
          <ArticleCard key={article.slug} article={article} />
        ))}
      </div>
    </section>
  )
}
