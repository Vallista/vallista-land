import * as Styled from './index.style'

import ArticleIcon from '@/assets/icons/article.svg?react'
import NoteIcon from '@/assets/icons/note.svg?react'
import ProjectIcon from '@/assets/icons/folder.svg?react'
import { Content } from '@/types'
import { Series } from '../Series'
import { useContents } from '@/hooks/useContents'

interface Props {
  content: Content | null
}

export const Header = (props: Props) => {
  const { content } = props
  const { findSeries } = useContents()

  if (!content) {
    return null
  }

  const { type, title, date, tags } = content

  const Icon = type === 'ARTICLE' ? ArticleIcon : type === 'NOTE' ? NoteIcon : ProjectIcon

  const newDate = new Date(date)
  const year = newDate.getFullYear()
  const month = String(newDate.getMonth() + 1).padStart(2, '0')
  const day = String(newDate.getDate()).padStart(2, '0')
  const formattedDate = `${year}년 ${month}월 ${day}일`

  const seriesName = type === 'ARTICLE' ? content.series?.name : undefined
  const series = seriesName ? findSeries(seriesName) : undefined

  return (
    <Styled._Wrap>
      <Styled._TitleIcon>
        <Icon />
      </Styled._TitleIcon>
      <Styled._Title>{title}</Styled._Title>
      <Styled._DateWrap>
        <Styled._Date>{formattedDate} 작성</Styled._Date>
      </Styled._DateWrap>
      {tags && tags.length !== 0 && (
        <Styled._TagWrap>
          {tags.map((tag, index) => (
            <Styled._Tag key={index}>{tag}</Styled._Tag>
          ))}
        </Styled._TagWrap>
      )}
      {!!series && <Series name={series?.[0]?.series?.name || ''} posts={series} />}
    </Styled._Wrap>
  )
}
