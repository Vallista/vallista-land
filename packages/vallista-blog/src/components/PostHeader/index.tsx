import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { Text, Badge, Container, Spacer } from '@vallista-land/core'
import { FC } from 'react'

import { getTime } from '../../utils'

interface PostHeaderProps {
  title: string
  tags?: string[]
  image?: string
  date: string
  author: string
  timeToRead: number
}

export const PostHeader: FC<PostHeaderProps> = (props) => {
  const { title, tags, date, author, timeToRead, children } = props
  const [year, month, day] = getTime(date)
  const dateToString = `${year}년 ${month}월 ${day}일`

  return (
    <Header>
      <Wrapper>
        <Text as='h1' size={40} weight={800}>
          {title}
        </Text>
        <Spacer y={0.5} />
        {tags && (
          <Container row>
            {tags.map((it) => (
              <Badge key={it} size='large'>
                {it}
              </Badge>
            ))}
          </Container>
        )}
        <Spacer y={1} />
        <Text size={16}>
          {dateToString}에 <Link href='/'>{author}</Link>가 작성했어요.
        </Text>
        <Spacer y={0.2} />
        <Text size={16}>읽는데 약 {timeToRead}분 걸려요!</Text>
        <Spacer y={1} />
        <ChildrenWrapper>{children}</ChildrenWrapper>
      </Wrapper>
    </Header>
  )
}

const Header = styled.header`
  text-align: center;
`

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  max-width: 900px;
  padding: 2rem;
  margin-left: auto;
  margin-right: auto;
`

const Link = styled.a`
  cursor: pointer;
  ${({ theme }) => css`
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
  `}
`

const ChildrenWrapper = styled.div`
  width: 100%;
`
