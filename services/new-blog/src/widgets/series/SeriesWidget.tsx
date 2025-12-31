import { Text, Container, Collapse, CollapseGroup } from '@vallista/design-system'
import { useNavigate } from 'react-router-dom'

import { Series } from '@shared/types'

import * as styles from './Series.css'

interface SeriesWidgetProps {
  series: Series
}

export function SeriesWidget({ series }: SeriesWidgetProps) {
  const navigate = useNavigate()

  const moveToLocation = (url: string) => {
    navigate(url)
  }

  return (
    <div className={styles.wrap} id='article-series'>
      <CollapseGroup>
        <Collapse title={series.name} card size='medium' subtitle={`시리즈의 글 (${series.posts.length}개)`}>
          <Container>
            <ol className={styles.list}>
              {series.posts.map((post) => (
                <li className={styles.item} key={post.slug}>
                  <span className={styles.itemSpan} onClick={() => moveToLocation(post.url)}>
                    <Text weight={600}>{post.title}</Text>
                  </span>
                </li>
              ))}
            </ol>
          </Container>
        </Collapse>
      </CollapseGroup>
    </div>
  )
}
