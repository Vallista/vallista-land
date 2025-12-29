import type { Meta, StoryObj } from '@storybook/react-vite'
import { Tag } from './index'

const meta: Meta<typeof Tag> = {
  title: 'Components/Tag',
  component: Tag,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '태그 컴포넌트입니다. 제거 가능한 태그를 지원합니다.'
      }
    }
  },
  argTypes: {
    hasRemove: {
      control: { type: 'boolean' },
      description: '제거 버튼 표시 여부'
    },
    children: {
      control: { type: 'text' },
      description: '태그 내용'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    id: 'tag1',
    children: 'Tag',
    hasRemove: false,
    onRemove: (id) => console.log('Remove tag:', id)
  }
}

export const WithRemove: Story = {
  args: {
    id: 'tag1',
    children: 'Removable Tag',
    hasRemove: true,
    onRemove: (id) => console.log('Remove tag:', id)
  }
}

export const LongText: Story = {
  args: {
    id: 'tag1',
    children: 'Very Long Tag Text That Should Be Truncated',
    hasRemove: true,
    onRemove: (id) => console.log('Remove tag:', id)
  }
}

export const MultipleTags: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      <Tag id='tag1' hasRemove={false} onRemove={(id) => console.log('Remove:', id)}>
        React
      </Tag>
      <Tag id='tag2' hasRemove={true} onRemove={(id) => console.log('Remove:', id)}>
        TypeScript
      </Tag>
      <Tag id='tag3' hasRemove={true} onRemove={(id) => console.log('Remove:', id)}>
        JavaScript
      </Tag>
      <Tag id='tag4' hasRemove={false} onRemove={(id) => console.log('Remove:', id)}>
        CSS
      </Tag>
      <Tag id='tag5' hasRemove={true} onRemove={(id) => console.log('Remove:', id)}>
        HTML
      </Tag>
    </div>
  )
}

export const Interactive: Story = {
  render: () => {
    const handleRemove = (id: string) => {
      alert(`Tag "${id}" would be removed`)
    }

    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        <Tag id='react' hasRemove={true} onRemove={handleRemove}>
          React
        </Tag>
        <Tag id='typescript' hasRemove={true} onRemove={handleRemove}>
          TypeScript
        </Tag>
        <Tag id='javascript' hasRemove={true} onRemove={handleRemove}>
          JavaScript
        </Tag>
      </div>
    )
  }
}
