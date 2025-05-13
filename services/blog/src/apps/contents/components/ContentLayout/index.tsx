import { MDXProvider } from '@mdx-js/react'
import { Markdown } from '../Markdown'
import { Header } from '../Header'
import Seo from '@/apps/layout/components/Seo'
import { Comment } from '@/apps/layout/components/Comment'

import { useContentLayout } from './useContentLayout'
import { Loading } from './index.style'
import { useEffect, useState } from 'react'
// import { useScrollTo } from '@/hooks/useScrollTo'

export const ContentLayout = () => {
  const { articleHeight, articleSeriesHeight, isPageReady, contentWithRaw, slug } = useContentLayout()
  // const { scrollToTop } = useScrollTo()
  const [hydrated, setHydrated] = useState(false)
  // const [nowSlug, setSlug] = useState(slug)

  const EmptyLayout = Loading(articleHeight, articleSeriesHeight)

  useEffect(() => {
    setHydrated(true)
  }, [])

  // useEffect(() => {
  //   if (isPageReady && nowSlug === slug) {
  //     document.body.style.overflow = ''
  //   } else {
  //     scrollToTop(false)
  //     document.body.style.overflow = 'hidden'
  //   }
  //   setSlug(slug)
  // }, [isPageReady, slug])

  return (
    <MDXProvider>
      <Header loading={hydrated && isPageReady} content={contentWithRaw} slug={slug} />
      <Markdown mdx={contentWithRaw?.raw} />
      {hydrated && isPageReady ? (
        <>
          <Seo
            name={contentWithRaw!.title}
            image={`${contentWithRaw!.url}/${contentWithRaw!.thumbnail}`}
            description={contentWithRaw!.description}
            isPost
            pathname={location.pathname}
          />
          <Comment />
        </>
      ) : (
        <EmptyLayout />
      )}
    </MDXProvider>
  )
}
