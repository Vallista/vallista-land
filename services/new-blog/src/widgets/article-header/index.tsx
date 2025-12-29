import { Text, Icon, Badge } from '@vallista/design-system'
import { Article } from '@shared/types'
import { formatDate } from '@shared/lib/utils'
import { SeriesWidget } from '@widgets/series'
import * as styles from './ArticleHeader.css'
import { useAutoFitText } from './useAutoFitText'
import { useWindowSize } from '@/shared/hooks'

interface ArticleHeaderProps {
  article: Article
  series?: {
    name: string
    posts: {
      title: string
      slug: string
      url: string
      order: number
    }[]
  }
}

export function ArticleHeader({ article, series }: ArticleHeaderProps) {
  const { title, date, tags } = article
  const { width } = useWindowSize()
  const isMobile = width < 1024

  const titleWrapRef = useAutoFitText({
    maxHeight: 120,
    minFontSize: 20,
    maxFontSize: 40
  })

  const formattedDate = formatDate(date)

  return (
    <div className={styles.wrap} id='article-header'>
      <div className={styles.titleIcon}>
        <Icon.Book size={36} color='currentColor' />
      </div>

      {!isMobile ? (
        <div className={styles.titleWrap}>
          <Text size={48} weight={700} color='primary' lineHeight={56}>
            {title}
          </Text>
        </div>
      ) : (
        <div ref={titleWrapRef} className={styles.titleWrap}>
          <Text size={48} weight={700} color='primary' lineHeight={56}>
            {title}
          </Text>
        </div>
      )}

      <div className={styles.dateWrap}>
        <span className={styles.date}>{formattedDate} 작성</span>
      </div>

      {tags && tags.length > 0 && (
        <div className={styles.tagWrap}>
          {tags.map((tag, index) => (
            <Badge key={index} type='secondary' variant='outline' size='normal'>
              {tag}
            </Badge>
          ))}
        </div>
      )}
      {/* 
      {description && (
        <div className={styles.description}>
          <Text color='secondary'>{description}</Text>
        </div>
      )} */}

      {series && <SeriesWidget series={series} />}
    </div>
  )
}
