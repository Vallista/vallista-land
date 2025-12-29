import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '../Button'
import { Container } from './index'

const meta: Meta<typeof Container> = {
  title: 'Components/Container',
  component: Container,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '레이아웃을 위한 컨테이너 컴포넌트입니다. Flexbox를 기반으로 하며 다양한 레이아웃 옵션을 제공합니다.'
      }
    }
  },
  argTypes: {
    row: {
      control: { type: 'boolean' },
      description: '가로 방향 레이아웃'
    },
    flex: {
      control: { type: 'text' },
      description: 'flex 값'
    },
    gap: {
      control: { type: 'number' },
      description: '요소 간 간격'
    },
    center: {
      control: { type: 'boolean' },
      description: '중앙 정렬'
    },
    wrap: {
      control: { type: 'boolean' },
      description: 'flex-wrap 설정'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
      <h3 style={{ marginBottom: '16px', color: '#333' }}>기본 컨테이너</h3>
      <Container>
        <Button>버튼 1</Button>
        <Button>버튼 2</Button>
        <Button>버튼 3</Button>
      </Container>
    </div>
  )
}

export const Row: Story = {
  render: () => (
    <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
      <h3 style={{ marginBottom: '16px', color: '#333' }}>가로 방향 컨테이너</h3>
      <Container row>
        <Button>버튼 1</Button>
        <Button>버튼 2</Button>
        <Button>버튼 3</Button>
      </Container>
    </div>
  )
}

export const WithGap: Story = {
  render: () => (
    <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
      <h3 style={{ marginBottom: '16px', color: '#333' }}>간격이 있는 컨테이너</h3>
      <Container gap={2}>
        <Button>버튼 1</Button>
        <Button>버튼 2</Button>
        <Button>버튼 3</Button>
      </Container>
    </div>
  )
}

export const Centered: Story = {
  render: () => (
    <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
      <h3 style={{ marginBottom: '16px', color: '#333' }}>중앙 정렬 컨테이너</h3>
      <Container center>
        <Button>버튼 1</Button>
        <Button>버튼 2</Button>
      </Container>
    </div>
  )
}

export const Wrapped: Story = {
  render: () => (
    <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
      <h3 style={{ marginBottom: '16px', color: '#333' }}>줄바꿈 컨테이너</h3>
      <Container wrap='wrap'>
        <Button>버튼 1</Button>
        <Button>버튼 2</Button>
        <Button>버튼 3</Button>
        <Button>버튼 4</Button>
        <Button>버튼 5</Button>
        <Button>버튼 6</Button>
      </Container>
    </div>
  )
}

export const ComplexLayout: Story = {
  render: () => (
    <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
      <h3 style={{ marginBottom: '16px', color: '#333' }}>복합 레이아웃</h3>
      <Container row gap={2} center>
        <Button>왼쪽</Button>
        <Button>중앙</Button>
        <Button>오른쪽</Button>
      </Container>
    </div>
  )
}
