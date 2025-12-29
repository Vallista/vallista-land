import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { ShowMore } from './index'

const meta: Meta<typeof ShowMore> = {
  title: 'Components/ShowMore',
  component: ShowMore,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '더 보기/접기 기능을 제공하는 컴포넌트입니다.'
      }
    }
  },
  argTypes: {
    expanded: {
      control: { type: 'boolean' },
      description: '펼쳐진 상태'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => {
    const [expanded, setExpanded] = useState(false)

    return (
      <div style={{ width: '400px' }}>
        <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '12px', color: '#333' }}>Content</h3>
          <p style={{ marginBottom: '12px', color: '#666' }}>This is some content that can be expanded or collapsed.</p>
          {expanded && (
            <div>
              <p style={{ marginBottom: '12px', color: '#666' }}>
                This is additional content that appears when expanded.
              </p>
              <p style={{ marginBottom: '12px', color: '#666' }}>You can add as much content as you need here.</p>
              <p style={{ color: '#666' }}>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
            </div>
          )}
          <ShowMore expanded={expanded} onClick={() => setExpanded(!expanded)} />
        </div>
      </div>
    )
  }
}

export const Expanded: Story = {
  render: () => {
    const [expanded, setExpanded] = useState(true)

    return (
      <div style={{ width: '400px' }}>
        <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '12px', color: '#333' }}>Content</h3>
          <p style={{ marginBottom: '12px', color: '#666' }}>This is some content that can be expanded or collapsed.</p>
          {expanded && (
            <div>
              <p style={{ marginBottom: '12px', color: '#666' }}>
                This is additional content that appears when expanded.
              </p>
              <p style={{ marginBottom: '12px', color: '#666' }}>You can add as much content as you need here.</p>
              <p style={{ color: '#666' }}>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
            </div>
          )}
          <ShowMore expanded={expanded} onClick={() => setExpanded(!expanded)} />
        </div>
      </div>
    )
  }
}

export const WithLongContent: Story = {
  render: () => {
    const [expanded, setExpanded] = useState(false)

    return (
      <div style={{ width: '500px' }}>
        <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '12px', color: '#333' }}>Article Title</h3>
          <p style={{ marginBottom: '12px', color: '#666' }}>
            This is the beginning of a long article that demonstrates the ShowMore component.
          </p>
          {expanded && (
            <div>
              <p style={{ marginBottom: '12px', color: '#666' }}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et
                dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip
                ex ea commodo consequat.
              </p>
              <p style={{ marginBottom: '12px', color: '#666' }}>
                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
                Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est
                laborum.
              </p>
              <p style={{ marginBottom: '12px', color: '#666' }}>
                Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam
                rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt
                explicabo.
              </p>
              <p style={{ color: '#666' }}>
                Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni
                dolores eos qui ratione voluptatem sequi nesciunt.
              </p>
            </div>
          )}
          <ShowMore expanded={expanded} onClick={() => setExpanded(!expanded)} />
        </div>
      </div>
    )
  }
}

export const Interactive: Story = {
  render: () => {
    const [expanded, setExpanded] = useState(false)

    return (
      <div style={{ width: '400px' }}>
        <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '12px', color: '#333' }}>Interactive Demo</h3>
          <p style={{ marginBottom: '12px', color: '#666' }}>
            Click the button below to expand or collapse this content.
          </p>
          {expanded && (
            <div>
              <p style={{ marginBottom: '12px', color: '#28a745' }}>✅ Content is now expanded!</p>
              <p style={{ marginBottom: '12px', color: '#666' }}>You can see additional information here.</p>
              <p style={{ color: '#666' }}>Click "SHOW LESS" to collapse it again.</p>
            </div>
          )}
          <ShowMore expanded={expanded} onClick={() => setExpanded(!expanded)} />
        </div>

        <div
          style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#e8f5e8',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        >
          <strong>Status:</strong> {expanded ? 'Expanded' : 'Collapsed'}
        </div>
      </div>
    )
  }
}
