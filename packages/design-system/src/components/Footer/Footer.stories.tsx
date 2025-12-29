import type { Meta, StoryObj } from '@storybook/react-vite'
import { Footer, FooterGroup, FooterLink } from './index'

const meta: Meta<typeof Footer> = {
  title: 'Components/Footer',
  component: Footer,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: '웹사이트의 푸터 컴포넌트입니다.'
      }
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: '기본 Footer 컴포넌트입니다.'
      }
    }
  },
  render: () => (
    <Footer>
      <FooterGroup title='Company'>
        <FooterLink href='#'>Home</FooterLink>
        <FooterLink href='#'>About</FooterLink>
        <FooterLink href='#'>Careers</FooterLink>
        <FooterLink href='#'>Partners</FooterLink>
        <FooterLink href='#'>Blog</FooterLink>
      </FooterGroup>
      <FooterGroup title='Product'>
        <FooterLink href='#'>Features</FooterLink>
        <FooterLink href='#'>Pricing</FooterLink>
        <FooterLink href='#'>Documentation</FooterLink>
        <FooterLink href='#'>API</FooterLink>
      </FooterGroup>
      <FooterGroup title='Support'>
        <FooterLink href='#'>Help Center</FooterLink>
        <FooterLink href='#'>Contact</FooterLink>
        <FooterLink href='#'>Status</FooterLink>
        <FooterLink href='#'>Community</FooterLink>
      </FooterGroup>
    </Footer>
  )
}

export const SingleGroup: Story = {
  parameters: {
    docs: {
      description: {
        story: '단일 그룹을 가진 Footer입니다.'
      }
    }
  },
  render: () => (
    <Footer>
      <FooterGroup title='Company'>
        <FooterLink href='#'>Home</FooterLink>
        <FooterLink href='#'>About</FooterLink>
        <FooterLink href='#'>Careers</FooterLink>
      </FooterGroup>
    </Footer>
  )
}

export const MultipleGroups: Story = {
  parameters: {
    docs: {
      description: {
        story: '여러 그룹을 가진 Footer입니다.'
      }
    }
  },
  render: () => (
    <Footer>
      <FooterGroup title='Company'>
        <FooterLink href='#'>Home</FooterLink>
        <FooterLink href='#'>About</FooterLink>
        <FooterLink href='#'>Careers</FooterLink>
        <FooterLink href='#'>Partners</FooterLink>
      </FooterGroup>
      <FooterGroup title='Product'>
        <FooterLink href='#'>Features</FooterLink>
        <FooterLink href='#'>Pricing</FooterLink>
        <FooterLink href='#'>Documentation</FooterLink>
        <FooterLink href='#'>API</FooterLink>
        <FooterLink href='#'>Integrations</FooterLink>
      </FooterGroup>
      <FooterGroup title='Support'>
        <FooterLink href='#'>Help Center</FooterLink>
        <FooterLink href='#'>Contact</FooterLink>
        <FooterLink href='#'>Status</FooterLink>
        <FooterLink href='#'>Community</FooterLink>
        <FooterLink href='#'>FAQ</FooterLink>
      </FooterGroup>
      <FooterGroup title='Legal'>
        <FooterLink href='#'>Privacy</FooterLink>
        <FooterLink href='#'>Terms</FooterLink>
        <FooterLink href='#'>Cookies</FooterLink>
        <FooterLink href='#'>Licenses</FooterLink>
      </FooterGroup>
    </Footer>
  )
}

export const WithCustomLinks: Story = {
  parameters: {
    docs: {
      description: {
        story: '커스텀 링크를 포함한 Footer입니다.'
      }
    }
  },
  render: () => (
    <Footer>
      <FooterGroup title='Company'>
        <FooterLink href='#'>Home</FooterLink>
        <FooterLink href='#'>About</FooterLink>
        <FooterLink custom>
          <span style={{ color: '#0070f3', fontWeight: 'bold' }}>Special Link</span>
        </FooterLink>
      </FooterGroup>
      <FooterGroup title='Social'>
        <FooterLink href='#'>Twitter</FooterLink>
        <FooterLink href='#'>GitHub</FooterLink>
        <FooterLink href='#'>LinkedIn</FooterLink>
        <FooterLink custom>
          <button style={{ background: 'none', border: 'none', color: '#0070f3', cursor: 'pointer' }}>Subscribe</button>
        </FooterLink>
      </FooterGroup>
    </Footer>
  )
}
