import { graphql } from 'gatsby'
import { useCallback, VFC } from 'react'
import { PageProps, PostQuery } from 'types/type'

import { Comment } from '../components/Comment'
import { Markdown } from '../components/Markdown'
import { PostHeader } from '../components/PostHeader'
import { Seo } from '../components/Seo'
import { Series } from '../components/Series'
import { useConfig } from '../hooks/useConfig'

const Post: VFC<PageProps<PostQuery>> = (props) => {
  const { profile } = useConfig()
  const { allMarkdownRemark } = props.data
  const { nodes, group: seriesGroup } = allMarkdownRemark
  const { timeToRead, html } = props.data.markdownRemark
  const { title, date, image, tags, series } = props.data.markdownRemark.frontmatter

  const cachedFilterSeries = useCallback(getFilteredSeries, [props.data])

  return (
    <div>
      <Seo name={title} image={image?.publicURL} isPost />
      <PostHeader
        title={title}
        date={date}
        image={image?.publicURL}
        tags={tags}
        timeToRead={timeToRead}
        author={profile.author}
      >
        {series && seriesGroup && <Series name={series} posts={cachedFilterSeries()} />}
      </PostHeader>
      <Markdown html={html} />
      <section id='comments'></section>
      <Comment />
    </div>
  )

  function getFilteredSeries(): { name: string; timeToRead: number; slug: string }[] {
    return nodes
      .filter((it) => it.frontmatter.series)
      .filter((it) => it.frontmatter.series === series)
      .map((it) => ({ name: it.frontmatter.title, timeToRead: it.timeToRead, slug: it.fields.slug }))
  }
}

export default Post

export const pageQuery = graphql`
  query BlogPostBySlug($id: String!) {
    allMarkdownRemark(sort: { fields: [frontmatter___date], order: DESC }) {
      nodes {
        fields {
          slug
        }
        timeToRead
        frontmatter {
          title
          series
        }
      }
      group(field: frontmatter___series) {
        fieldValue
        totalCount
      }
    }
    markdownRemark(id: { eq: $id }) {
      id
      html
      fields {
        slug
      }
      timeToRead
      frontmatter {
        title
        tags
        date
        image {
          publicURL
        }
        series
      }
    }
  }
`
