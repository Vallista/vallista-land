import styled from '@emotion/styled'
import { Container, Spacer, Text } from '@vallista-land/core'
import { graphql } from 'gatsby'
import { useMemo, useState, VFC } from 'react'

import { Layout } from '../components/Layout'
import { ListTable } from '../components/ListTable'
import { SearchBox } from '../components/SearchBox'
import { IndexQuery, PageProps } from '../types/type'
import { toDate, getTime } from '../utils'

const PostsPage: VFC<PageProps<IndexQuery>> = (props) => {
  const { data } = props
  const { edges } = data.allMarkdownRemark
  const [search, setSearch] = useState('')

  const sortPosts = useMemo(() => {
    return edges
      .sort((a, b) => {
        const base = toDate(a.node.frontmatter.date)
        const target = toDate(b.node.frontmatter.date)

        return target.getTime() - base.getTime()
      })
      .map((it) => {
        const { slug } = it.node.fields
        const { date, title: name } = it.node.frontmatter
        const [, month, day] = getTime(date)
        const time = toDate(date)

        return {
          time: time.getTime(),
          date: `${Number(month)}월 ${day}일`,
          name,
          slug
        }
      })
      .sort((a, b) => Number(b.time) - Number(a.time))
  }, [edges])

  const posts = useMemo(() => {
    const remake = edges
      .sort((a, b) => {
        const base = toDate(a.node.frontmatter.date)
        const target = toDate(b.node.frontmatter.date)

        return target.getTime() - base.getTime()
      })
      .reduce<Record<string, Array<{ name: string; date: string; slug: string }>>>((acc, curr) => {
        const { slug } = curr.node.fields
        const { date, title: name } = curr.node.frontmatter
        const [year, month, day] = getTime(date)

        if (!acc[year]) acc[year] = []

        acc[year].push({
          name,
          date: `${Number(month)}월 ${day}일`,
          slug
        })

        return acc
      }, {})

    const values = Object.values(remake)
    return Object.keys(remake)
      .map((it, idx) => ({
        year: it,
        posts: values[idx]
      }))
      .sort((a, b) => Number(b.year) - Number(a.year))
  }, [edges])

  const filteredSearchPosts = useMemo(() => sortPosts.filter((it) => it.name.includes(search)), [sortPosts, search])

  const hasSearchText = search.length !== 0

  return (
    <Layout edges={edges}>
      <Wrapper>
        <Container>
          <SearchBox value={search} onSearch={setSearch} size='large' placeholder='검색할 텍스트를 입력하세요.' />
          <Spacer y={2} />
        </Container>
        {hasSearchText ? (
          filteredSearchPosts.length === 0 ? (
            <>
              <Text size={20} weight={600}>
                검색된 결과가 없어요 :(
              </Text>
              <Text size={20} weight={600}>
                다른 결과를 검색해보시겠어요?
              </Text>
            </>
          ) : (
            <ListTable underline title='검색결과' list={filteredSearchPosts} />
          )
        ) : (
          posts.map((it) => (
            <Container key={it.year}>
              <div>
                <ListTable title={it.year} list={it.posts} underline />
              </div>
              <Spacer y={2} />
            </Container>
          ))
        )}
      </Wrapper>
    </Layout>
  )
}

const Wrapper = styled.div`
  margin: 0 auto;
  max-width: 900px;
  padding: 2rem;
`
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
