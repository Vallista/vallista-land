import * as Styled from './index.style'

import ArticleIcon from '@/assets/icons/article.svg?react'
import NoteIcon from '@/assets/icons/note.svg?react'
import ProjectIcon from '@/assets/icons/folder.svg?react'
import { Article, Content } from '@/types'
import { Series } from '../Series'
import { useContents } from '@/hooks/useContents'

interface Props {
  loading: boolean
  content?: Content
  slug: string
}

export const Header = (props: Props) => {
  const { content, slug } = props
  const { findSeries } = useContents(slug)

  // if (!content || !loading) {
  //   return (
  //     <Styled._Wrap id='article-header' hasLoading={false}>
  //       <Styled._TitleIconSkeleton />
  //       <Styled._TitleSkeleton />
  //       <Styled._DateWrap>
  //         <Styled._DateSkeleton />
  //       </Styled._DateWrap>
  //     </Styled._Wrap>
  //   )
  // }

  const { type, title, date, tags } = content || {
    type: '',
    title: '',
    date: '',
    tags: []
  }

  const Icon = type === 'ARTICLE' ? ArticleIcon : type === 'NOTE' ? NoteIcon : ProjectIcon

  const newDate = new Date(date)
  const year = newDate.getFullYear()
  const month = String(newDate.getMonth() + 1).padStart(2, '0')
  const day = String(newDate.getDate()).padStart(2, '0')
  const formattedDate = `${year}년 ${month}월 ${day}일`

  const seriesName = type === 'ARTICLE' ? (content as Article)?.series?.name : undefined
  const series = seriesName ? findSeries(seriesName) : undefined

  return (
    <div className={Styled.wrap} id='article-header'>
      <div className={Styled.titleIcon}>
        <Icon />
      </div>
      <h1 className={Styled.title}>{title}</h1>
      <div className={Styled.dateWrap}>
        <span className={Styled.date}>{formattedDate} 작성</span>
      </div>
      {tags && tags.length !== 0 && (
        <div className={Styled.tagWrap}>
          {tags.map((tag, index) => (
            <span className={Styled.tag} key={index}>
              {tag}
            </span>
          ))}
        </div>
      )}
      {!!series && <Series name={series?.[0]?.series?.name || ''} posts={series} />}
    </div>
  )
}
