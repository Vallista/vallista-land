import { useContents } from '@/hooks/useContents'
import { MDXProvider } from '@mdx-js/react'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Markdown } from '../components/Markdown'
import { Header } from '../components/Header'
import { Content } from '@/types'
import Seo from '@/apps/layout/components/Seo'
import { Comment } from '@/apps/layout/components/Comment'
import { Loading } from '@/apps/layout/components/Loading'

const Page = () => {
  const location = useLocation()
  const slug = decodeURIComponent(location.pathname).split('/').pop() || ''
  const { findContent, findContentWithRaw } = useContents()
  const [mdx, setMdx] = useState<string>('')
  const [content, setContent] = useState<Content | null>(null)

  useEffect(() => {
    ;(async () => {
      const result = await findContentWithRaw(slug)
      setContent(await findContent(slug))
      setMdx(result.raw)
    })()
  }, [findContent, findContentWithRaw, slug])

  return (
    <MDXProvider>
      {content && (
        <Loading slug={slug}>
          <Seo
            name={content.title}
            image={`${content.url}/${content.thumbnail}`}
            isPost
            pathname={location.pathname}
            siteUrl={window.location.origin}
          />
          <Header content={content} />
          <Markdown mdx={mdx} />
          <Comment />
        </Loading>
      )}
    </MDXProvider>
  )
}

export default Page
