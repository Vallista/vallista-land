import { ContentPage } from '@shared/ui/ContentPage'
import { useContentPageQuery, useCategory } from '@shared/hooks'
import { loadAllContent, ContentIndex } from '@shared/lib/content'
import * as styles from './HomePage.css'
import { AboutPage } from '../about'

export function HomePage() {
  const { data: content, isLoading, error } = useContentPageQuery<ContentIndex>(['content'], loadAllContent)

  const { filteredContents, categoryInfo } = useCategory({ content })

  return (
    <ContentPage
      title='Vallista Blog'
      description='기술과 개발에 대한 생각을 나누는 공간입니다.'
      content={filteredContents}
      isLoading={isLoading}
      error={error}
      emptyMessage={categoryInfo.emptyMessage}
      className={styles.root}
    >
      <AboutPage />
    </ContentPage>
  )
}
