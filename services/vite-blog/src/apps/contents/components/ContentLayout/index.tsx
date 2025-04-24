import { MDXProvider } from '@mdx-js/react'

import { Markdown } from '../Markdown'
import { Header } from '../Header'
import Seo from '@/apps/layout/components/Seo'
import { Comment } from '@/apps/layout/components/Comment'

import { useContentLayout } from './useContentLayout'
import { Loading } from './index.style'
import { useEffect } from 'react'
import { useScrollTo } from '@/hooks/useScrollTo'

export const ContentLayout = () => {
  const { articleHeight, articleSeriesHeight, isPageReady, contentWithRaw, slug } = useContentLayout()
  const { scrollToTop } = useScrollTo()

  const EmptyLayout = Loading(articleHeight, articleSeriesHeight)

  useEffect(() => {
    if (isPageReady) {
      document.body.style.overflow = ''
    } else {
      scrollToTop(false)
      document.body.style.overflow = 'hidden'
    }
  }, [isPageReady])

  return (
    <MDXProvider>
      <Header loading={isPageReady} content={contentWithRaw} slug={slug} />
      <Markdown loading={isPageReady} mdx={contentWithRaw?.raw} />
      {isPageReady && (
        <>
          <Seo
            name={contentWithRaw!.title}
            image={`${contentWithRaw!.url}/${contentWithRaw!.thumbnail}`}
            isPost
            pathname={location.pathname}
            siteUrl={window.location.origin}
          />
          <Comment />
        </>
      )}
      {!isPageReady && <EmptyLayout />}
    </MDXProvider>
  )
}
