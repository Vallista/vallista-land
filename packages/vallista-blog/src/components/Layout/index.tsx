import { Container } from '@vallista-land/core'
import { FC, useMemo } from 'react'

import { IndexQuery } from '../../types/type'
import { NavBar } from '../NavBar'
import Seo from '../Seo'
import { Sidebar } from '../Sidebar'

interface LayoutProps {
  seo?: {
    title?: string
    description?: string
    image?: string
    article?: string
  }
  edges: IndexQuery['allMarkdownRemark']['edges']
}

export const Layout: FC<LayoutProps> = (props) => {
  const { children, seo, edges } = props
  const posts = useMemo(
    () =>
      edges.map((it) => ({
        name: it.node.frontmatter.title,
        slug: it.node.fields.slug,
        series: it.node.frontmatter.series || null,
        image: it.node.frontmatter.image?.publicURL || null
      })),
    [edges]
  )

  return (
    <>
      <Seo {...seo} />
      <Container>
        <NavBar />
        <Sidebar posts={posts} />
        {children}
      </Container>
    </>
  )
}
