import { Collapse, Container } from '@vallista/design-system'
import { useNavigate } from 'react-router'
import { FC } from 'react'

import * as Styled from './Series.style'

interface SeriesProps {
  name: string
  posts: {
    name: string
    timeToRead: number
    slug: string
  }[]
}

export const Series: FC<SeriesProps> = (props) => {
  const { name, posts } = props
  const navigate = useNavigate()

  const moveToLocation = (slug: string) => {
    navigate(slug)
  }

  return (
    <Collapse title={name} card size='medium' subtitle={`시리즈의 글 (${posts.length}개)`}>
      <Container>
        <Styled._List>
          {posts.map((it) => (
            <Styled._Item timeToRead={it.timeToRead} key={it.name}>
              <span onClick={() => moveToLocation(it.slug)}>{it.name}</span>
            </Styled._Item>
          ))}
        </Styled._List>
      </Container>
    </Collapse>
  )
}
