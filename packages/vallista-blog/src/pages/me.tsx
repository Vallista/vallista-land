import { graphql } from 'gatsby'
import { VFC } from 'react'

import { Layout } from '../components/Layout'
import { IndexQuery, PageProps } from '../types/type'

const MePage: VFC<PageProps<IndexQuery>> = (props) => {
  const { data } = props
  const { edges } = data.allMarkdownRemark

  return <Layout edges={edges}></Layout>
}

export default MePage

export const pageQuery = graphql`
  query BlogMeQuery {
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
