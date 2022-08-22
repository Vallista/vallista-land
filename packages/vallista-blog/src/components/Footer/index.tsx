import { Footer as FooterWrapper, FooterGroup, FooterLink, Spacer, Text } from '@vallista/core'
import { Link } from 'gatsby'
import { VFC } from 'react'

import * as Styled from './Footer.style'

export const Footer: VFC = () => {
  const nowYear = new Date().getFullYear()

  return (
    <div>
      <Styled._FooterBox>
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
      </Styled._FooterBox>
      <Styled._FooterAllRightReserve>
        <Text size={12}>
          Copyright ⓒ {nowYear} <Link to='https://vallista.kr'>Vallista</Link> All rights reserved.
        </Text>
        <Spacer y={0.1} />
        <Text size={12}>
          Created by <Link to='https://vallista.kr'>@Vallista</Link>. Powered By{' '}
          <a href='https://github.com/Vallista/vallista-land'>@Vallista-land</a>
        </Text>
        <Spacer y={0.5} />
      </Styled._FooterAllRightReserve>
    </div>
  )
}
