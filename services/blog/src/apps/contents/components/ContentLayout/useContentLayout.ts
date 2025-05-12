import { useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useContents } from '@/hooks/useContents'
import { useGlobalProvider } from '@/context/useProvider'
import { useContentWithRaw } from '@/hooks/useContentWithRaw'

export const useContentLayout = () => {
  const location = useLocation()
  const slug = decodeURIComponent(location.pathname).split('/').pop() || ''
  const { state } = useGlobalProvider()
  const { selectedCategory } = state

  const { isLoading: contentsLoading, allContents } = useContents(selectedCategory)
  const { data: contentWithRaw, isLoading: contentLoading } = useContentWithRaw(slug, allContents)

  const isPageReady = !contentsLoading && !contentLoading && !!contentWithRaw

  // 👉 DOM 요소 접근은 CSR에서만 실행
  const [articleHeight, setArticleHeight] = useState(0)
  const [articleSeriesHeight, setArticleSeriesHeight] = useState(0)

  useEffect(() => {
    const article = document.getElementById('article-header')
    const series = document.getElementById('article-series')

    setArticleHeight(article?.clientHeight || 0)
    setArticleSeriesHeight(series?.clientHeight || 0)
  }, [contentWithRaw]) // 콘텐츠가 바뀔 때 다시 측정

  return {
    isPageReady,
    articleHeight,
    articleSeriesHeight,
    contentWithRaw,
    slug
  }
}
