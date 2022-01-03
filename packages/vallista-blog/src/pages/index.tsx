import styled from '@emotion/styled'
import { Button, Text } from '@vallista-land/core'
import { graphql, navigate } from 'gatsby'
import { VFC } from 'react'

import { Layout } from '../components/Layout'
import { ListTable } from '../components/ListTable'
import { IndexQuery, PageProps } from '../types/type'
import { getTime } from '../utils'

const IndexPage: VFC<PageProps<IndexQuery>> = (props) => {
  const { data } = props
  const { edges } = data.allMarkdownRemark

  return (
    <Layout edges={edges}>
      <Header>
        <Wrapper>
          <Title>
            <Text as='h1' size={48} weight={800}>
              어서오세요! ✋
            </Text>
            <Text as='h1' size={48} weight={800} lineHeight={56}>
              저는 마광휘입니다.
            </Text>
          </Title>
          <SubTitle>
            <Text as='p' size={20} weight={400} lineHeight={40}>
              대한민국 서울에서 <strong>소프트웨어 엔지니어</strong>로 일하고 있어요. 한 분야에 국한되지 않는 여러
              문제를 해결하는 것에 즐거움을 느낍니다. 공부하고 느낀점을 위주로 블로그에 글을 작성하고 있어요. 최근에는
              프론트엔드 문제 해결에 관심이 많아, 많은 시간을 쏟고 있어요. 러스트를 기반으로한 웹 생태계가 기대돼요!
            </Text>
          </SubTitle>
          <Button size='large' color='alert' onClick={() => moveToLocation('/posts')}>
            <Text size={16} weight={800}>
              블로그 글 보러갈까요?
            </Text>
          </Button>
        </Wrapper>
      </Header>
      <Contents>
        <ListTable
          title='최근 글'
          list={edges
            .filter((_, idx) => idx < 6)
            .map((it) => ({
              name: it.node.frontmatter.title,
              slug: it.node.fields.slug,
              date: getSimpleDate(it.node.frontmatter.date)
            }))}
        />
      </Contents>
    </Layout>
  )

  function getSimpleDate(target: string): string {
    const [, month, day] = getTime(target)

    return `${month}월 ${day}일`
  }

  function moveToLocation(target: string): void {
    navigate(target)
  }
}

const Wrapper = styled.div`
  margin-left: auto;
  margin-right: auto;
  max-width: 900px;
  padding: 2rem;
`

const Header = styled.header`
  padding: 2rem 0;
`

const Title = styled.div`
  margin-bottom: 1.5rem;
  max-width: 550px;
`

const SubTitle = styled.div`
  max-width: 550px;
  margin-bottom: 2rem;
`

const Contents = styled.div`
  margin-left: auto;
  margin-right: auto;
  max-width: 900px;
  padding: 2rem;
`

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