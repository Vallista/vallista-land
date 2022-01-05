import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { useLocation } from '@reach/router'
import { Container } from '@vallista-land/core'
import { graphql, useStaticQuery } from 'gatsby'
import { FC, useEffect, useMemo, useState } from 'react'

import { Header } from '../../components/Header'
import { IndexQuery } from '../../types/type'
import { NavBar } from '../NavBar'
import { Sidebar } from '../Sidebar'

export const Layout: FC = (props) => {
  const location = useLocation()
  const { children } = props
  const data: IndexQuery = useStaticQuery(layoutQuery)
  const { nodes } = data.allMarkdownRemark
  // Sidebar Folding
  const [fold, setFold] = useState(false)

  const posts = useMemo(
    () =>
      nodes
        .filter((it) =>
          !it.frontmatter.draft
            ? true
            : (typeof window === 'undefined' ? '' : location.host).includes('localhost')
            ? true
            : false
        )
        .map((it) => ({
          name: it.frontmatter.title,
          slug: it.fields.slug,
          series: it.frontmatter.series || null,
          image: it.frontmatter.image?.publicURL || '/profile.png'
        })),
    [nodes]
  )

  useEffect(() => {
    setFold(window.localStorage.getItem('sidebar-fold') === 'true')
  }, [])

  useEffect(() => {
    window.localStorage.setItem('sidebar-fold', String(fold))
  }, [fold])

  return (
    <Wrapper>
      <Container>
        <NavBar />
        <Sidebar posts={posts} fold={fold} />
        <Header fold={fold} folding={handleFold} />
        <Main fold={fold}>
          <Article>{children}</Article>
        </Main>
      </Container>
    </Wrapper>
  )

  function handleFold(): void {
    const flag = !fold
    setFold(flag)
  }
}

const Wrapper = styled.div`
  min-height: 100vh;
  ${({ theme }) => css`
    color: ${theme.colors.PRIMARY.FOREGROUND};
    background: ${theme.colors.PRIMARY.BACKGROUND};
  `}
`

const Main = styled.main<{ fold: boolean }>`
  margin-top: 43px;
  margin-left: 400px;

  ${({ theme, fold }) => css`
    background: ${theme.colors.PRIMARY.BACKGROUND};
    ${fold &&
    css`
      margin-left: 80px;
    `}
  `}

  @media screen and (max-width: 1000px) {
    margin-left: 0;
    margin-top: 123px;
  }
`

const Article = styled.article`
  ${({ theme }) => css`
    /* a */
    a {
      cursor: pointer;
      border-bottom: 2px solid ${theme.colors.HIGHLIGHT.PINK};
      font-weight: 600;
      text-decoration: none;
      color: ${theme.colors.PRIMARY.FOREGROUND};
      transition: all 0.1s ease-out;

      &:hover {
        background: ${theme.colors.HIGHLIGHT.PINK};
        border-top: 2px solid ${theme.colors.HIGHLIGHT.PINK};
        color: ${theme.colors.PRIMARY.BACKGROUND};
      }
    }
  `}
`

const layoutQuery = graphql`
  query {
    allMarkdownRemark(sort: { fields: [frontmatter___date], order: DESC }) {
      nodes {
        fields {
          slug
        }
        frontmatter {
          title
          date
          image {
            publicURL
          }
          draft
        }
      }
    }
  }
`
