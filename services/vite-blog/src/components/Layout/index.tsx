import { Container } from '@vallista/design-system'
import { useEffect, useState } from 'react'

// import { Header } from '../Header'
// import { IndexQuery } from '../../types/type'
import { localStorage } from '../../utils'
// import { Footer } from '../Footer'
import { NavBar } from '../NavBar'
// import { Sidebar } from '../Sidebar'
import * as Styled from './Layout.style'
import { Sidebar } from '../Sidebar'
import { Header } from '../Header'
import { SidebarPost } from '../../types/type'
import { Footer } from '../Footer'
import { Outlet } from 'react-router'
import { useArticles } from '../../hooks/useArticles'

export const Layout = () => {
  // const data: IndexQuery = useStaticQuery(allPostsQuery)
  // const { nodes } = data.allMarkdownRemark
  // Sidebar Folding
  const [fold, setFold] = useState(false)
  const { filteredArticles } = useArticles()

  // const posts = useMemo(
  //   () =>
  //     filteredByDraft(nodes).map((it) => ({
  //       name: it.frontmatter.title,
  //       slug: it.fields.slug,
  //       series: it.frontmatter.series || null,
  //       image: it.frontmatter.image?.publicURL || '/profile.png',
  //       tags: it.frontmatter.tags || []
  //     })),
  //   [nodes]
  // )

  const posts: SidebarPost[] = filteredArticles.map(() => ({
    name: '', //it.data.title,
    slug: '', //it.data.slug,
    series: '', // it.data.series || null,
    image: '', //it.data.image || '/profile.png',
    tags: [] as string[] // it.data.tags || []
  }))

  useEffect(() => {
    setFold(localStorage.get('sidebar-fold') === 'true')
  }, [])

  useEffect(() => {
    localStorage.set('sidebar-fold', String(fold))
  }, [fold])

  const handleFold = () => {
    setFold(!fold)
  }

  return (
    <Styled._Wrapper>
      <Container>
        <NavBar />
        <Sidebar posts={posts} fold={fold} />
        <Header fold={fold} folding={handleFold} />
        <Styled._Main fold={fold}>
          <Styled._Article>
            <Outlet />
          </Styled._Article>
          <Footer />
        </Styled._Main>
      </Container>
    </Styled._Wrapper>
  )
}

// const allPostsQuery = graphql`
//   query {
//     allMarkdownRemark(sort: { fields: [frontmatter___date], order: DESC }) {
//       nodes {
//         fields {
//           slug
//         }
//         frontmatter {
//           title
//           date
//           image {
//             publicURL
//           }
//           draft
//           tags
//         }
//       }
//     }
//   }
// `
