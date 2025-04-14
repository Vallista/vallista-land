import { MDXProvider } from '@mdx-js/react'
import { useEffect, useState } from 'react'

const Page = () => {
  const getMdxFile = async () => {
    const mdxFile = `${window.location.origin}/contents/articles/2017%EB%85%84-%ED%9A%8C%EA%B3%A0/index.html`

    const response = await fetch(mdxFile)
    return response.text()
  }

  const [mdx, setMdx] = useState<string>('')

  useEffect(() => {
    const fetchMdxFile = async () => {
      const file = await getMdxFile()
      setMdx(file)
    }

    fetchMdxFile()
  }, [mdx])

  return (
    <MDXProvider>
      <div dangerouslySetInnerHTML={{ __html: mdx }}></div>
    </MDXProvider>
  )
}

export default Page
