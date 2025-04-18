import { useEffect, useState } from 'react'
import * as API from '../apis'
import { Article, Content, ContentType, ContentWithRaw, Note, Project } from '../types'

/**
 * 콘텐츠를 가져오는 훅입니다.
 */
export const useContents = () => {
  const [contents, setContents] = useState<Content[]>([])

  useEffect(() => {
    ;(async () => {
      const result = await fetchContents()
      setContents(result)
    })()
  }, [])

  const fetchContents = async () => {
    const result = await API.fetchContents()

    const aggregate = Object.entries(result).map(([, value]) => {
      // 마지막 부분에 있는 s를 제거
      const type = value.category.slice(0, -1).toLocaleUpperCase() as ContentType

      const baseContent = {
        type,
        slug: value.slug,
        title: value.title,
        date: value.date,
        tags: value.tags,
        path: value.path,
        url: value.url,
        draft: value.draft,
        thumbnail: value.image
      }

      switch (type) {
        case 'ARTICLE':
          return {
            ...baseContent,
            series: value.series
              ? {
                  name: value.series,
                  priority: value.seriesPrority
                }
              : undefined
          } as Article
        case 'NOTE':
          return baseContent as Note
        case 'PROJECT':
          return baseContent as Project
      }
    })

    return aggregate
  }

  const articles = contents.filter((content) => content.type === 'ARTICLE') as Article[]
  const notes = contents.filter((content) => content.type === 'NOTE') as Note[]
  const projects = contents.filter((content) => content.type === 'PROJECT') as Project[]

  /**
   * 단일 콘텐츠의 정보를 가져옵니다.
   * @param slug - 콘텐츠의 slug를 넣어주세요.
   */
  const findContent = async (slug: string) => {
    let result = contents

    if (!result) {
      result = await fetchContents()
      setContents(result)
    }

    const content = result.find((content) => content.slug === slug)

    if (!content) {
      throw new Error('콘텐츠를 가져오는 데 실패했습니다.')
    }

    return content
  }

  /**
   * 단일 콘텐츠의 정보와 원본 데이터를 가져옵니다.
   * @param slug - 콘텐츠의 slug를 넣어주세요.
   */
  const findContentWithRaw = async (slug: string): Promise<ContentWithRaw> => {
    const meta = await findContent(slug)
    const raw = await API.fetctContent(meta.path)

    return {
      ...meta,
      raw
    }
  }

  return {
    contents: contents,
    articles,
    notes,
    projects,
    findContent,
    findContentWithRaw
  }
}
