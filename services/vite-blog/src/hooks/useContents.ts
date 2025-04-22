import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import * as API from '../apis'
import { Article, Content, ContentType, Note, Project } from '../types'

const parseContent = (value: API.Post): Content => {
  const type = value.category.slice(0, -1).toUpperCase() as ContentType
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
}

export const useContents = (selectedCategory: string) => {
  const { data: allContents = [], isLoading } = useQuery<Content[]>({
    queryKey: ['contents'],
    queryFn: async () => {
      const raw = await API.fetchContents()
      return Object.values(raw).map(parseContent)
    }
  })

  const articles = useMemo(() => allContents.filter((c): c is Article => c.type === 'ARTICLE'), [allContents])

  const notes = useMemo(() => allContents.filter((c): c is Note => c.type === 'NOTE'), [allContents])

  const projects = useMemo(() => allContents.filter((c): c is Project => c.type === 'PROJECT'), [allContents])

  const filtered = useMemo(() => {
    if (!selectedCategory) return allContents
    const type = selectedCategory.slice(0, -1).toUpperCase()
    return allContents
      .filter((it) => it.type === type)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [allContents, selectedCategory])

  const findSeries = (seriesName: string) =>
    articles
      .filter((it) => it.series?.name === seriesName)
      .sort((a, b) => (a.series?.priority || 0) - (b.series?.priority || 0))

  return {
    isLoading,
    contents: filtered,
    articles,
    notes,
    projects,
    allContents, // useContentWithRaw에서 사용
    findSeries
  }
}
