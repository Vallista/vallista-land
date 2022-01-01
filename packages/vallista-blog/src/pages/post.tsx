import styled from '@emotion/styled'
import { Container, Note } from '@vallista-land/core'
import { graphql } from 'gatsby'
import { VFC } from 'react'
import { PageProps, PostQuery } from 'types/query'

import { MarkdownProvider } from '../components/MarkdownProvider'

const Post: VFC<PageProps<PostQuery>> = (props) => {
  const { markdownRemark } = props.data
  console.log(props.data)
  return (
    <Container>
      <article>
        <header>{markdownRemark.frontmatter.title}</header>
        <MarkdownProvider>
          <Markdown id='post-markdown' dangerouslySetInnerHTML={{ __html: markdownRemark.html }} />
        </MarkdownProvider>
      </article>
    </Container>
  )
}

export default Post

const Markdown = styled.div`
  max-width: 900px;
  padding: 2rem;
  @media screen and (max-width: 1000px) {
    padding: 1.5rem;
  }
  margin-left: auto;
  margin-right: auto;
`

export const pageQuery = graphql`
  query BlogPostQuery($id: String) {
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
          timeToRead
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
            series
            seriesPriority
          }
          html
        }
      }
      group(field: frontmatter___tags) {
        fieldValue
        totalCount
      }
    }
    seriesGroup: allMarkdownRemark {
      group(field: frontmatter___series) {
        fieldValue
        totalCount
      }
    }
    markdownRemark(id: { eq: $id }) {
      id
      html
      excerpt
      fields {
        slug
      }
      headings {
        id
        value
        depth
      }
      timeToRead
      frontmatter {
        title
        tags
        date
        image {
          relativePath
          relativeDirectory
          root
          sourceInstanceName
          publicURL
        }
        series
      }
    }
  }
`
