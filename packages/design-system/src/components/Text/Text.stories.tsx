import type { Meta, StoryObj } from '@storybook/react-vite'
import { Text } from './index'

const meta: Meta<typeof Text> = {
  title: 'Components/Text',
  component: Text,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '텍스트 컴포넌트입니다. 다양한 크기와 색상을 지원합니다.'
      }
    }
  },
  argTypes: {
    as: {
      control: { type: 'select' },
      options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'small', 'span', 'div', 'label'],
      description: '렌더링할 HTML 요소'
    },
    size: {
      control: { type: 'select' },
      options: [10, 12, 14, 16, 20, 24, 32, 40, 48],
      description: '폰트 크기'
    },
    weight: {
      control: { type: 'select' },
      options: [100, 200, 300, 400, 500, 600, 700, 800, 900],
      description: '폰트 굵기'
    },
    color: {
      control: { type: 'color' },
      description: '텍스트 색상'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
      <h3 style={{ marginBottom: '16px', color: '#333' }}>기본 텍스트</h3>
      <Text
        as='p'
        size={16}
        weight={400}
        color='#000000'
        lineHeight={20}
        transform='lowercase'
        align='left'
        textWrap={false}
      >
        기본 텍스트입니다.
      </Text>
    </div>
  )
}

export const AllSizes: Story = {
  render: () => (
    <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
      <h3 style={{ marginBottom: '16px', color: '#333' }}>모든 크기</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Text
          as='p'
          size={10}
          weight={400}
          color='#000000'
          lineHeight={12}
          transform='none'
          align='left'
          textWrap={false}
        >
          매우 작은 텍스트 (10px)
        </Text>
        <Text
          as='p'
          size={12}
          weight={400}
          color='#000000'
          lineHeight={16}
          transform='none'
          align='left'
          textWrap={false}
        >
          작은 텍스트 (12px)
        </Text>
        <Text
          as='p'
          size={14}
          weight={400}
          color='#000000'
          lineHeight={20}
          transform='none'
          align='left'
          textWrap={false}
        >
          기본 텍스트 (14px)
        </Text>
        <Text
          as='p'
          size={16}
          weight={400}
          color='#000000'
          lineHeight={24}
          transform='none'
          align='left'
          textWrap={false}
        >
          큰 텍스트 (16px)
        </Text>
        <Text
          as='p'
          size={20}
          weight={400}
          color='#000000'
          lineHeight={24}
          transform='none'
          align='left'
          textWrap={false}
        >
          매우 큰 텍스트 (20px)
        </Text>
        <Text
          as='p'
          size={24}
          weight={400}
          color='#000000'
          lineHeight={32}
          transform='none'
          align='left'
          textWrap={false}
        >
          2배 큰 텍스트 (24px)
        </Text>
        <Text
          as='p'
          size={32}
          weight={400}
          color='#000000'
          lineHeight={40}
          transform='none'
          align='left'
          textWrap={false}
        >
          3배 큰 텍스트 (32px)
        </Text>
      </div>
    </div>
  )
}

export const AllWeights: Story = {
  render: () => (
    <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
      <h3 style={{ marginBottom: '16px', color: '#333' }}>모든 굵기</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Text
          as='p'
          size={16}
          weight={100}
          color='#000000'
          lineHeight={20}
          transform='none'
          align='left'
          textWrap={false}
        >
          얇은 텍스트 (100)
        </Text>
        <Text
          as='p'
          size={16}
          weight={200}
          color='#000000'
          lineHeight={20}
          transform='none'
          align='left'
          textWrap={false}
        >
          매우 얇은 텍스트 (200)
        </Text>
        <Text
          as='p'
          size={16}
          weight={300}
          color='#000000'
          lineHeight={20}
          transform='none'
          align='left'
          textWrap={false}
        >
          밝은 텍스트 (300)
        </Text>
        <Text
          as='p'
          size={16}
          weight={400}
          color='#000000'
          lineHeight={20}
          transform='lowercase'
          align='left'
          textWrap={false}
        >
          일반 텍스트 (400)
        </Text>
        <Text
          as='p'
          size={16}
          weight={500}
          color='#000000'
          lineHeight={20}
          transform='none'
          align='left'
          textWrap={false}
        >
          중간 텍스트 (500)
        </Text>
        <Text
          as='p'
          size={16}
          weight={600}
          color='#000000'
          lineHeight={20}
          transform='none'
          align='left'
          textWrap={false}
        >
          반굵은 텍스트 (600)
        </Text>
        <Text
          as='p'
          size={16}
          weight={700}
          color='#000000'
          lineHeight={20}
          transform='none'
          align='left'
          textWrap={false}
        >
          굵은 텍스트 (700)
        </Text>
        <Text
          as='p'
          size={16}
          weight={800}
          color='#000000'
          lineHeight={20}
          transform='none'
          align='left'
          textWrap={false}
        >
          매우 굵은 텍스트 (800)
        </Text>
        <Text
          as='p'
          size={16}
          weight={900}
          color='#000000'
          lineHeight={20}
          transform='none'
          align='left'
          textWrap={false}
        >
          검은 텍스트 (900)
        </Text>
      </div>
    </div>
  )
}

export const Combinations: Story = {
  render: () => (
    <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
      <h3 style={{ marginBottom: '16px', color: '#333' }}>조합 예시</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Text
          as='p'
          size={24}
          weight={700}
          color='#0070f3'
          lineHeight={32}
          transform='none'
          align='left'
          textWrap={false}
        >
          큰 굵은 기본 색상 텍스트
        </Text>
        <Text
          as='p'
          size={20}
          weight={600}
          color='#22c55e'
          lineHeight={24}
          transform='none'
          align='left'
          textWrap={false}
        >
          중간 굵은 성공 색상 텍스트
        </Text>
        <Text
          as='p'
          size={16}
          weight={400}
          color='#666666'
          lineHeight={20}
          transform='none'
          align='left'
          textWrap={false}
        >
          기본 굵은 보조 색상 텍스트
        </Text>
        <Text
          as='p'
          size={14}
          weight={300}
          color='#ef4444'
          lineHeight={20}
          transform='none'
          align='left'
          textWrap={false}
        >
          작은 밝은 오류 색상 텍스트
        </Text>
      </div>
    </div>
  )
}

export const Headings: Story = {
  render: () => (
    <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
      <h3 style={{ marginBottom: '16px', color: '#333' }}>제목 스타일</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Text
          as='h1'
          size={48}
          weight={700}
          color='#000000'
          lineHeight={56}
          transform='none'
          align='left'
          textWrap={false}
        >
          제목 1 (H1)
        </Text>
        <Text
          as='h2'
          size={32}
          weight={600}
          color='#000000'
          lineHeight={40}
          transform='none'
          align='left'
          textWrap={false}
        >
          제목 2 (H2)
        </Text>
        <Text
          as='h3'
          size={24}
          weight={600}
          color='#000000'
          lineHeight={32}
          transform='none'
          align='left'
          textWrap={false}
        >
          제목 3 (H3)
        </Text>
        <Text
          as='h4'
          size={20}
          weight={500}
          color='#000000'
          lineHeight={24}
          transform='none'
          align='left'
          textWrap={false}
        >
          제목 4 (H4)
        </Text>
        <Text
          as='h5'
          size={16}
          weight={500}
          color='#000000'
          lineHeight={20}
          transform='none'
          align='left'
          textWrap={false}
        >
          제목 5 (H5)
        </Text>
        <Text
          as='h6'
          size={14}
          weight={500}
          color='#000000'
          lineHeight={20}
          transform='none'
          align='left'
          textWrap={false}
        >
          제목 6 (H6)
        </Text>
      </div>
    </div>
  )
}
