import * as Styled from './index.style'

interface MarkdownProps {
  mdx: string
}

export const Markdown = (props: MarkdownProps) => {
  const { mdx } = props

  return <Styled._Markdown dangerouslySetInnerHTML={{ __html: mdx }} />
}
