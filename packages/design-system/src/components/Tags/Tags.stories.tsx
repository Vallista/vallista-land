import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Tags } from './index'
import { Tag } from '../Tag'

const meta: Meta<typeof Tags> = {
  title: 'Components/Tags',
  component: Tags,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '여러 Tag 컴포넌트를 그룹화하는 컨테이너 컴포넌트입니다.'
      }
    }
  },
  argTypes: {
    gap: {
      control: { type: 'select' },
      options: [0, 1, 2, 3, 4, 5],
      description: '태그 간 간격'
    },
    justifyContent: {
      control: { type: 'select' },
      options: ['flex-start', 'flex-end', 'center', 'space-between', 'space-around'],
      description: '가로 정렬'
    },
    alignItems: {
      control: { type: 'select' },
      options: ['flex-start', 'flex-end', 'center', 'stretch', 'baseline'],
      description: '세로 정렬'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
      <h3 style={{ marginBottom: '16px', color: '#333' }}>Default Tags</h3>
      <Tags>
        <Tag>React</Tag>
        <Tag>TypeScript</Tag>
        <Tag>Next.js</Tag>
        <Tag>Tailwind CSS</Tag>
      </Tags>
    </div>
  )
}

export const WithGap: Story = {
  render: () => (
    <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
      <h3 style={{ marginBottom: '16px', color: '#333' }}>Tags with Different Gaps</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <strong>Gap 1:</strong>
          <Tags gap={1}>
            <Tag>Small</Tag>
            <Tag>Gap</Tag>
            <Tag>Tags</Tag>
          </Tags>
        </div>
        <div>
          <strong>Gap 3:</strong>
          <Tags gap={3}>
            <Tag>Medium</Tag>
            <Tag>Gap</Tag>
            <Tag>Tags</Tag>
          </Tags>
        </div>
        <div>
          <strong>Gap 5:</strong>
          <Tags gap={5}>
            <Tag>Large</Tag>
            <Tag>Gap</Tag>
            <Tag>Tags</Tag>
          </Tags>
        </div>
      </div>
    </div>
  )
}

export const JustifyContent: Story = {
  render: () => (
    <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
      <h3 style={{ marginBottom: '16px', color: '#333' }}>Different Justify Content</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <strong>flex-start:</strong>
          <Tags justifyContent='flex-start' maxWidth='300px'>
            <Tag>Left</Tag>
            <Tag>Aligned</Tag>
            <Tag>Tags</Tag>
          </Tags>
        </div>
        <div>
          <strong>center:</strong>
          <Tags justifyContent='center' maxWidth='300px'>
            <Tag>Center</Tag>
            <Tag>Aligned</Tag>
            <Tag>Tags</Tag>
          </Tags>
        </div>
        <div>
          <strong>flex-end:</strong>
          <Tags justifyContent='flex-end' maxWidth='300px'>
            <Tag>Right</Tag>
            <Tag>Aligned</Tag>
            <Tag>Tags</Tag>
          </Tags>
        </div>
        <div>
          <strong>space-between:</strong>
          <Tags justifyContent='space-between' maxWidth='300px'>
            <Tag>Space</Tag>
            <Tag>Between</Tag>
            <Tag>Tags</Tag>
          </Tags>
        </div>
      </div>
    </div>
  )
}

export const WithRemovableTags: Story = {
  render: () => {
    const [tags, setTags] = useState(['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'Storybook'])

    const handleRemove = (id: string) => {
      setTags(tags.filter((tag) => tag !== id))
    }

    return (
      <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
        <h3 style={{ marginBottom: '16px', color: '#333' }}>Removable Tags</h3>
        <Tags gap={2}>
          {tags.map((tag) => (
            <Tag key={tag} id={tag} hasRemove onRemove={handleRemove}>
              {tag}
            </Tag>
          ))}
        </Tags>
        <div style={{ marginTop: '12px', fontSize: '14px', color: '#666' }}>
          <strong>Remaining tags:</strong> {tags.length}
        </div>
      </div>
    )
  }
}

export const MixedContent: Story = {
  render: () => (
    <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
      <h3 style={{ marginBottom: '16px', color: '#333' }}>Mixed Content Tags</h3>
      <Tags gap={3} justifyContent='center'>
        <Tag>Frontend</Tag>
        <Tag hasRemove>Backend</Tag>
        <Tag>Database</Tag>
        <Tag hasRemove>DevOps</Tag>
        <Tag>Testing</Tag>
      </Tags>
    </div>
  )
}

export const ResponsiveLayout: Story = {
  render: () => (
    <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
      <h3 style={{ marginBottom: '16px', color: '#333' }}>Responsive Tags Layout</h3>
      <Tags gap={2} maxWidth='400px' minHeight='60px'>
        <Tag>Responsive</Tag>
        <Tag>Design</Tag>
        <Tag>System</Tag>
        <Tag>Components</Tag>
        <Tag>Flexible</Tag>
        <Tag>Layout</Tag>
        <Tag>Adaptive</Tag>
        <Tag>Mobile</Tag>
        <Tag>Desktop</Tag>
      </Tags>
    </div>
  )
}
