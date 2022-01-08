import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { Container, Footer, FooterGroup, FooterLink, Spacer, Text } from '@vallista-land/core'
import { graphql, Link, useStaticQuery } from 'gatsby'
import { FC, useEffect, useMemo, useState } from 'react'

import { Header } from '../../components/Header'
import { IndexQuery } from '../../types/type'
import { filteredByDraft } from '../../utils'
import { NavBar } from '../NavBar'
import { Sidebar } from '../Sidebar'

export const Layout: FC = (props) => {
  const { children } = props
  const data: IndexQuery = useStaticQuery(layoutQuery)
  const { nodes } = data.allMarkdownRemark
  // Sidebar Folding
  const [fold, setFold] = useState(false)

  const posts = useMemo(
    () =>
      filteredByDraft(nodes).map((it) => ({
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
          <div>
            <FooterBox>
              <Footer>
                <FooterGroup title='사이트 맵'>
                  <FooterLink custom>
                    <Link to='/'>홈</Link>
                  </FooterLink>
                  <FooterLink custom>
                    <Link to='/posts'>포스트</Link>
                  </FooterLink>
                  <FooterLink custom>
                    <Link to='/resume'>이력서</Link>
                  </FooterLink>
                </FooterGroup>
                <FooterGroup title='관련 사이트'>
                  <FooterLink href='https://vallista.tistory.com'>다른 블로그</FooterLink>
                  <FooterLink href='https://career.woowahan.com/'>우아한형제들 채용</FooterLink>
                  <FooterLink href='https://techblog.woowahan.com/'>우아한형제들 기술블로그</FooterLink>
                </FooterGroup>
              </Footer>
            </FooterBox>
            <FooterAllRightReserve>
              <Text size={14}>
                Copyright ⓒ 2021 <Link to='https://vallista.kr'>Vallista</Link> All rights reserved.
              </Text>
              <Spacer y={0.1} />
              <Text size={14}>
                Created by <Link to='https://vallista.kr'>@Vallista</Link>. Powered By{' '}
                <a href='https://github.com/Vallista/vallista-land'>@Vallista-land</a>
              </Text>
              <Spacer y={0.5} />
            </FooterAllRightReserve>
          </div>
        </Main>
      </Container>
    </Wrapper>
  )

  function handleFold(): void {
    const flag = !fold
    setFold(flag)
  }
}

const FooterAllRightReserve = styled.p`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 60px;
  ${({ theme }) => css`
    background: ${theme.colors.PRIMARY.ACCENT_1};
    color: ${theme.colors.PRIMARY.ACCENT_3};

    & a {
      color: ${theme.colors.PRIMARY.FOREGROUND};
      text-decoration: none;
    }
  `}
`

const Wrapper = styled.div`
  min-height: 100vh;
  ${({ theme }) => css`
    color: ${theme.colors.PRIMARY.FOREGROUND};
    background: ${theme.colors.PRIMARY.BACKGROUND};
  `}
`

const Main = styled.main<{ fold: boolean }>`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: calc(100vh - 43px);
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

const FooterBox = styled.div`
  ${({ theme }) => css`
    @media screen and (min-width: 1001px) {
      width: 100%;
      margin: 0 auto;
      display: flex;
      justify-content: center;
      border-top: 1px solid ${theme.colors.PRIMARY.ACCENT_2};

      & > footer {
        width: 900px;
        box-sizing: border-box;
        padding: 2rem 2rem 1rem 2rem;
        border-top: none;

        & > nav {
          justify-content: flex-start;
          gap: 2rem;
        }
      }
      background: ${theme.colors.PRIMARY.ACCENT_1};
    }
  `}
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
