import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { Footer as FooterWrapper, FooterGroup, FooterLink, Spacer, Text } from '@vallista-land/core'
import { Link } from 'gatsby'
import { VFC } from 'react'

export const Footer: VFC = () => {
  const nowYear = new Date().getFullYear()

  return (
    <div>
      <FooterBox>
        <FooterWrapper>
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
        </FooterWrapper>
      </FooterBox>
      <FooterAllRightReserve>
        <Text size={12}>
          Copyright ⓒ {nowYear} <Link to='https://vallista.kr'>Vallista</Link> All rights reserved.
        </Text>
        <Spacer y={0.1} />
        <Text size={12}>
          Created by <Link to='https://vallista.kr'>@Vallista</Link>. Powered By{' '}
          <a href='https://github.com/Vallista/vallista-land'>@Vallista-land</a>
        </Text>
        <Spacer y={0.5} />
      </FooterAllRightReserve>
    </div>
  )
}

const FooterBox = styled.div`
  ${({ theme }) => css`
    @media screen and (min-width: 1025px) {
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
