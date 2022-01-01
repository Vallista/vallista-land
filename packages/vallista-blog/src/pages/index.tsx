import { Text } from '@vallista-land/core'
import { graphql } from 'gatsby'
import { VFC } from 'react'
import { IndexQuery, PageProps } from 'types/query'

const IndexPage: VFC<PageProps<IndexQuery>> = (props) => {
  console.log(props)
  return <Text>HelloWorld</Text>
}

export default IndexPage

export const pageQuery = graphql`
  query BlogIndexQuery {
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
