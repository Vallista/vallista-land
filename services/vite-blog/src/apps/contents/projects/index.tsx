import { useContents } from '@/hooks/useContents'
import { MDXProvider } from '@mdx-js/react'
import { useLocation } from 'react-router-dom'
import { Markdown } from '../components/Markdown'
import { Header } from '../components/Header'
import Seo from '@/apps/layout/components/Seo'
import { Comment } from '@/apps/layout/components/Comment'
import { Loading } from '@/apps/layout/components/Loading'
import { useGlobalProvider } from '@/context/useProvider'
import { useContentWithRaw } from '@/hooks/useContentWithRaw'

const Page = () => {
  const location = useLocation()
  const slug = decodeURIComponent(location.pathname).split('/').pop() || ''
  const { state } = useGlobalProvider()
  const { selectedCategory } = state

  const { isLoading: contentsLoading, allContents } = useContents(selectedCategory)
  const { data: contentWithRaw, isLoading: contentLoading } = useContentWithRaw(slug, allContents)

  const isPageReady = !contentsLoading && !contentLoading && contentWithRaw

  return (
    <MDXProvider>
      {isPageReady && (
        <Loading slug={slug}>
          <Seo
            name={contentWithRaw.title}
            image={`${contentWithRaw.url}/${contentWithRaw.thumbnail}`}
            isPost
            pathname={location.pathname}
            siteUrl={window.location.origin}
          />
          <Header content={contentWithRaw} />
          <Markdown mdx={contentWithRaw.raw} />
          <Comment />
        </Loading>
      )}
    </MDXProvider>
  )
}

export default Page
