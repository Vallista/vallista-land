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
    // MEMO: 스크롤을 최상단으로 이동
    document.getElementsByTagName('main')[0].scrollTo({
      top: 0,
      behavior: 'smooth'
    })

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })

    navigate(slug)
  }

  return (
    <Styled._Wrap>
      <CollapseGroup>
        <Collapse title={name} card size='medium' subtitle={`시리즈의 글 (${posts.length}개)`}>
          <Container>
            <Styled._List>
              {posts.map((it) => (
                <Styled._Item key={it.title}>
                  <span onClick={() => moveToLocation(it.url)}>{it.title}</span>
                </Styled._Item>
              ))}
            </Styled._List>
          </Container>
        </Collapse>
      </CollapseGroup>
    </Styled._Wrap>
  )
}
