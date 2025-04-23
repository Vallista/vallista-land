import { useLocation } from 'react-router-dom'
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

  const articleHeight = document.getElementById('article-header')?.clientHeight || 0
  const articleSeriesHeight = document.getElementById('article-series')?.clientHeight || 0

  return {
    isPageReady,
    articleHeight,
    articleSeriesHeight,
    contentWithRaw,
    slug
  }
}
