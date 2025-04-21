import { useContents } from '@/hooks/useContents'
import { MDXProvider } from '@mdx-js/react'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'

const Page = () => {
  const location = useLocation()
  const slug = location.pathname.split('/').pop() || ''
  const { findContentWithRaw } = useContents()
  const [mdx, setMdx] = useState<string>('')

  useEffect(() => {
    ;(async () => {
      const result = await findContentWithRaw(slug)
      setMdx(result.raw)
    })()
  }, [findContentWithRaw, mdx, slug])

  return (
    <MDXProvider>
      <div dangerouslySetInnerHTML={{ __html: mdx }}></div>
    </MDXProvider>
  )
}

export default Page
