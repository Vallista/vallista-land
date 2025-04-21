import { useContents } from '@/hooks/useContents'
import { MDXProvider } from '@mdx-js/react'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import { Markdown } from '../components/Markdown'
import { Header } from '../components/Header'
import { Content } from '@/types'

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
  }, [findContent, findContentWithRaw, mdx, slug])

  return (
    <MDXProvider>
      <Header content={content} />
      <Markdown mdx={mdx} />
    </MDXProvider>
  )
}

export default Page
