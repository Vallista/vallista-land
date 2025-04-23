import { useContents } from '@/hooks/useContents'
import { MDXProvider } from '@mdx-js/react'
import { useLocation } from 'react-router-dom'
import { Markdown } from '../components/Markdown'
import { Header } from '../components/Header'
import Seo from '@/apps/layout/components/Seo'
import { Comment } from '@/apps/layout/components/Comment'
import { useGlobalProvider } from '@/context/useProvider'
import { useContentWithRaw } from '@/hooks/useContentWithRaw'
import styled from '@emotion/styled'

const Page = () => {
  const location = useLocation()
  const slug = decodeURIComponent(location.pathname).split('/').pop() || ''
  const { state } = useGlobalProvider()
  const { selectedCategory } = state

  const { isLoading: contentsLoading, allContents } = useContents(selectedCategory)
  const { data: contentWithRaw, isLoading: contentLoading } = useContentWithRaw(slug, allContents)

  const isPageReady = !contentsLoading && !contentLoading && !!contentWithRaw

  const articleHeight = document.getElementById('article-header')?.clientHeight || 0
  const articleSeriesHeight = document.getElementById('article-series')?.clientHeight || 0

  const EmptyLayout = Loading(articleHeight, articleSeriesHeight)

  return (
    <MDXProvider>
      <Header loading={isPageReady} content={contentWithRaw} slug={slug} />
      {contentWithRaw && (
        <>
          <Seo
            name={contentWithRaw.title}
            image={`${contentWithRaw.url}/${contentWithRaw.thumbnail}`}
            isPost
            pathname={location.pathname}
            siteUrl={window.location.origin}
          />
          <Markdown mdx={contentWithRaw.raw} />
          <Comment />
        </>
      )}
      {!isPageReady && <EmptyLayout />}
    </MDXProvider>
  )
}

export const Loading = (articleHeight: number, seriesHeight: number) => styled.div`
  height: 100vh; // calc(100vh - ${articleHeight + seriesHeight}px);
`

export default Page
