import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { Collapse, Container } from '@vallista-land/core'
import { navigate } from 'gatsby'
import { VFC } from 'react'

interface SeriesProps {
  name: string
  posts: {
    name: string
    timeToRead: number
  }[]
}

export const Series: VFC<SeriesProps> = (props) => {
  const { name, posts } = props

  return (
    <Collapse title={name} card size='medium' subtitle='시리즈의 다른 글도 읽어보세요!'>
      <Container>
        <List>
          {posts.map((it) => (
            <Item timeToRead={it.timeToRead} key={it.name}>
              <span onClick={() => moveToLocation(it.name)}>{it.name}</span>
            </Item>
          ))}
        </List>
      </Container>
    </Collapse>
  )

  function moveToLocation(name: string): void {
    navigate(`/${replaceSpaceToHypen(name)}`)
  }

  function replaceSpaceToHypen(value: string): string {
    return value.replaceAll(' ', '-')
  }
}

const List = styled.ol`
  padding-left: 1.5rem;
  box-sizing: border-box;
  line-height: 1.6;
  list-style: decimal;
`

const Item = styled.li<{ timeToRead: number }>`
  ${({ theme, timeToRead }) => css`
    margin-bottom: 0.5rem;
    &::marker {
      font-weight: 600;
      color: ${theme.colors.HIGHLIGHT.PINK};
    }

    &::after {
      content: '- ${timeToRead}분';
      margin-left: 0.2rem;
      font-size: 0.8rem;
    }

    & > span {
      cursor: pointer;
      border-bottom: 2px solid ${theme.colors.HIGHLIGHT.PINK};
      font-weight: 600;
      text-decoration: none;
      color: ${theme.colors.PRIMARY.FOREGROUND};
      transition: all 0.1s ease-out;

      &:hover {
        background: ${theme.colors.HIGHLIGHT.PINK};
        border-top: 2px solid ${theme.colors.HIGHLIGHT.PINK};
        color: ${theme.colors.PRIMARY.BACKGROUND};
      }
    }
  `}
`
