import { Text, Badge } from '@vallista/design-system'
import { Link } from 'react-router-dom'

import { formatDate } from '@shared/lib/utils'
import { ArticleMeta } from '@shared/types'

import * as styles from './ArticleCard.css'

interface ArticleCardProps {
  article: ArticleMeta
}

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Link to={`/articles/${article.slug}`} className={styles.card}>
      {article.image && (
        <div className={styles.imageContainer}>
          <img src={article.image} alt={article.title} className={styles.image} loading='lazy' />
        </div>
      )}

      <div className={styles.content}>
        <div className={styles.meta}>
          <Text size={14} color='secondary'>
            {formatDate(article.date)}
          </Text>
          {article.readingTime && (
            <Text size={14} color='secondary'>
              {article.readingTime}분 읽기
            </Text>
          )}
        </div>

        <div className={styles.title}>
          <Text size={32} weight={700}>
            {article.title}
          </Text>
        </div>

        <div className={styles.description}>
          <Text color='secondary'>{article.description}</Text>
        </div>

        {article.tags && article.tags.length > 0 && (
          <div className={styles.tags}>
            {article.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} type='secondary' variant='outline' size='small'>
                {tag}
              </Badge>
            ))}
            {article.tags.length > 3 && (
              <Text size={14} color='secondary'>
                +{article.tags.length - 3}
              </Text>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
