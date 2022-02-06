import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { useLocation } from '@reach/router'
import { Text, Badge, Container, Spacer, Tooltip, copy, useToasts } from '@vallista-land/core'
import { Link } from 'gatsby'
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
  const location = useLocation()
  const toast = useToasts()
  const dateToString = `${year}년 ${Number(month)}월 ${Number(day)}일`

  return (
    <Header>
      <Wrapper>
        <HeaderTitle>
          <Text as='h1' size={40} weight={800}>
            {title}
          </Text>
          <Spacer y={1} />
          {tags && (
            <Container row wrap='wrap' gap={0.5}>
              {tags.map((it) => (
                <Badge key={it} size='large'>
                  #{it}
                </Badge>
              ))}
            </Container>
          )}
          <Spacer y={1} />
          <BottomBox>
            <TextContainer>
              <Text size={16} as='span'>
                Written by <Link to='/'>{author}</Link>
              </Text>
              <Spacer y={0.25} />
              <Text size={14} as='span'>
                {dateToString} · {timeToRead} min read
              </Text>
            </TextContainer>
            <IconContainer>
              <Tooltip text='페이스북 공유' position='top'>
                <Icon onClick={facebookShare}>
                  <svg
                    viewBox='0 0 24 24'
                    width='16'
                    height='16'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    fill='none'
                    shapeRendering='geometricPrecision'
                  >
                    <path d='M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z' />
                  </svg>
                </Icon>
              </Tooltip>
              <Tooltip text='링크 복사' position='top'>
                <Icon onClick={linkCopy}>
                  <svg
                    viewBox='0 0 24 24'
                    width='16'
                    height='16'
                    stroke='currentColor'
                    strokeWidth='2.5'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    fill='none'
                    shapeRendering='geometricPrecision'
                  >
                    <path d='M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71' />
                    <path d='M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71' />
                  </svg>
                </Icon>
              </Tooltip>
            </IconContainer>
          </BottomBox>
        </HeaderTitle>
        <Spacer y={1} />
        <ChildrenWrapper>{children}</ChildrenWrapper>
      </Wrapper>
    </Header>
  )

  function facebookShare(): void {
    toast.error('페이스북 공유 기능은 개발중입니다.')
  }

  function linkCopy(): void {
    copy(location.href)
    toast.success('링크를 복사했습니다.')
  }
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

  @media screen and (max-width: 1024px) {
    padding: 1.5rem 1rem;
  }
`

const BottomBox = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;

  @media screen and (max-width: 1024px) {
    flex-direction: column-reverse;
    align-items: flex-start;
    justify-content: center;
  }
`

const TextContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
`

const IconContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
`

const Icon = styled.button`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 30px;
  height: 30px;
  outline: none;
  border: none;
  border-radius: 15px;
  cursor: pointer;
  padding: 0;

  ${({ theme }) => css`
    background: ${theme.colors.PRIMARY.FOREGROUND};
    color: ${theme.colors.PRIMARY.BACKGROUND};
  `}
`

const HeaderTitle = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  width: 100%;
  padding: 0 1.5rem;

  & > h1 {
    text-align: left;
  }
`

const ChildrenWrapper = styled.div`
  width: 100%;
`
