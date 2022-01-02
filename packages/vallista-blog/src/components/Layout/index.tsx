import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { Container } from '@vallista-land/core'
import { FC, useMemo, useState } from 'react'

import { Header } from '../../components/Header'
import { useConfig } from '../../hooks/useConfig'
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
  const { placeholder } = useConfig()
  const { children, seo, edges } = props
  // Sidebar Folding
  const [fold, setFold] = useState(localStorage.getItem('sidebar-fold') === 'true')

  const posts = useMemo(
    () =>
      edges.map((it) => ({
        name: it.node.frontmatter.title,
        slug: it.node.fields.slug,
        series: it.node.frontmatter.series || null,
        image: it.node.frontmatter.image?.publicURL || placeholder
      })),
    [edges]
  )

  return (
    <Wrapper>
      <Seo {...seo} />
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
    localStorage.setItem('sidebar-fold', String(flag))
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
