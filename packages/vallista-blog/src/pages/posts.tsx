import { graphql } from 'gatsby'
import { VFC } from 'react'

import { Layout } from '../components/Layout'
import { IndexQuery, PageProps } from '../types/type'

const PostsPage: VFC<PageProps<IndexQuery>> = (props) => {
  const { data } = props
  const { edges } = data.allMarkdownRemark

  return <Layout edges={edges}></Layout>
}

export default PostsPage

export const pageQuery = graphql`
  query BlogPostsQuery {
    allMarkdownRemark(
      sort: { fields: [frontmatter___date], order: DESC }
      filter: { frontmatter: { draft: { eq: false } } }
    ) {
      edges {
        node {
          excerpt
          fields {
            slug
          }
          frontmatter {
            title
            date
            tags
            image {
              relativePath
              relativeDirectory
              root
              sourceInstanceName
              publicURL
            }
          }
          html
        }
      }
      group(field: frontmatter___tags) {
        fieldValue
        totalCount
      }
    }
  }
`
