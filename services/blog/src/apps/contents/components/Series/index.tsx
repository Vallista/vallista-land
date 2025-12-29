import { Collapse, CollapseGroup, Container } from '@vallista/design-system'
import { useNavigate } from 'react-router-dom'
import { FC } from 'react'

import * as Styled from './Series.style'

interface SeriesProps {
  name: string
  posts: {
    title: string
    url: string
  }[]
}

export const Series: FC<SeriesProps> = (props) => {
  const { name, posts } = props
  const navigate = useNavigate()

  const moveToLocation = (slug: string) => {
    navigate(slug)
  }

  return (
    <div className={Styled.wrap} id='article-series'>
      <CollapseGroup>
        <Collapse title={name} card size='medium' subtitle={`시리즈의 글 (${posts.length}개)`}>
          <Container>
            <ol className={Styled.list}>
              {posts.map((it) => (
                <li className={Styled.item} key={it.title}>
                  <span onClick={() => moveToLocation(it.url)}>{it.title}</span>
                </li>
              ))}
            </ol>
          </Container>
        </Collapse>
      </CollapseGroup>
    </div>
  )
}
