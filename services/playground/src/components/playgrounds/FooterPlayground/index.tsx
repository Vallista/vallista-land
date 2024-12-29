import { Container, Footer, FooterGroup, FooterLink } from '@vallista/core'
import { VFC } from 'react'

const FooterPlayground: VFC = () => {
  return (
    <Container>
      <Footer>
        <FooterGroup title='Company'>
          <FooterLink href='#'>Home</FooterLink>
          <FooterLink href='#'>About</FooterLink>
          <FooterLink href='#'>Careers</FooterLink>
          <FooterLink href='#'>Partners</FooterLink>
          <FooterLink href='#'>Blog</FooterLink>
          <FooterLink href='#'>Next.js Conf</FooterLink>
        </FooterGroup>

        <FooterGroup title='Product'>
          <FooterLink href='#'>Pricing</FooterLink>
          <FooterLink href='#'>Vercel for GitHub</FooterLink>
          <FooterLink href='#'>Vercel for GitLab</FooterLink>
          <FooterLink href='#'>Vercel for Bitbucket</FooterLink>
          <FooterLink href='#'>Vercel Edge Network</FooterLink>
          <FooterLink href='#'>Integrations Marketplace</FooterLink>
          <FooterLink href='#'>Command-Line</FooterLink>
        </FooterGroup>

        <FooterGroup title='Education'>
          <FooterLink href='#'>Documentation</FooterLink>
          <FooterLink href='#'>Guides</FooterLink>
          <FooterLink href='#'>Support</FooterLink>
        </FooterGroup>

        <FooterGroup title='More'>
          <FooterLink href='#'>Open Source Software</FooterLink>
          <FooterLink href='#'>Design System</FooterLink>
        </FooterGroup>
      </Footer>
    </Container>
  )
}

export default FooterPlayground
