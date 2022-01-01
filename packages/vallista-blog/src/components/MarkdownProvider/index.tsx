import { MDXProvider, MDXProviderComponentsProp } from '@mdx-js/react'
import { Text } from '@vallista-land/core'
import { FC } from 'react'

const components: MDXProviderComponentsProp = {
  p: Text
}

export const MarkdownProvider: FC = ({ children }) => {
  return <MDXProvider components={components}>{children}</MDXProvider>
}
