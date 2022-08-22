import { useLocation } from '@reach/router'
import { Text, Badge, Container, Spacer, Tooltip, copy, useToasts } from '@vallista/core'
import { Link } from 'gatsby'
import { FC } from 'react'

import { getTime } from '../../utils'
import * as Styled from './PostHeader.style'

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
    <Styled._Header>
      <Styled._Wrapper>
        <Styled._HeaderTitle>
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
          <Styled._BottomBox>
            <Styled._TextContainer>
              <Text size={16} as='span'>
                Written by <Link to='/'>{author}</Link>
              </Text>
              <Spacer y={0.25} />
              <Text size={14} as='span'>
                {dateToString} · {timeToRead} min read
              </Text>
            </Styled._TextContainer>
            <Styled._IconContainer>
              <Tooltip text='페이스북 공유' position='top'>
                <Styled._Icon onClick={facebookShare}>
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
                </Styled._Icon>
              </Tooltip>
              <Tooltip text='링크 복사' position='top'>
                <Styled._Icon onClick={linkCopy}>
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
                </Styled._Icon>
              </Tooltip>
            </Styled._IconContainer>
          </Styled._BottomBox>
        </Styled._HeaderTitle>
        <Spacer y={1} />
        <Styled._ChildrenWrapper>{children}</Styled._ChildrenWrapper>
      </Styled._Wrapper>
    </Styled._Header>
  )

  function facebookShare(): void {
    toast.error('페이스북 공유 기능은 개발중입니다.')
  }

  function linkCopy(): void {
    copy(decodeURIComponent(location.href))
    toast.success('링크를 복사했습니다.')
  }
}
