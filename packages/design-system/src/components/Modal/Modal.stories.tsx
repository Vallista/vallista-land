import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Button } from '../Button'
import { Text } from '../Text'

// 간단한 Modal 컴포넌트 생성
const SimpleModal = ({
  active,
  onClose,
  children
}: {
  active: boolean
  onClose: () => void
  children: React.ReactNode
}) => {
  if (!active) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '8px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

const meta: Meta<typeof SimpleModal> = {
  title: 'Components/Modal',
  component: SimpleModal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '모달 컴포넌트입니다. 다양한 모달 레이아웃을 지원합니다.'
      }
    }
  },
  argTypes: {
    active: {
      control: { type: 'boolean' },
      description: '모달 활성화 상태'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => {
    const [active, setActive] = useState(false)

    return (
      <>
        <Button onClick={() => setActive(true)}>Open Modal</Button>
        <SimpleModal active={active} onClose={() => setActive(false)}>
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 'bold' }}>Modal Title</h2>
            <p style={{ margin: '0 0 16px 0', color: '#666', fontSize: '14px' }}>This is a modal subtitle</p>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <Text>Content within the modal.</Text>
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button size='small' onClick={() => setActive(false)}>
              Cancel
            </Button>
            <Button size='small' onClick={() => setActive(false)}>
              Submit
            </Button>
          </div>
        </SimpleModal>
      </>
    )
  }
}

export const SimpleModalStory: Story = {
  render: () => {
    const [active, setActive] = useState(false)

    return (
      <>
        <Button onClick={() => setActive(true)}>Open Simple Modal</Button>
        <SimpleModal active={active} onClose={() => setActive(false)}>
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 'bold' }}>Simple Modal</h2>
            <Text>This is a simple modal with just a title and content.</Text>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button size='small' onClick={() => setActive(false)}>
              Close
            </Button>
          </div>
        </SimpleModal>
      </>
    )
  }
}

export const ModalWithCustomContent: Story = {
  render: () => {
    const [active, setActive] = useState(false)

    return (
      <>
        <Button onClick={() => setActive(true)}>Open Modal with Custom Content</Button>
        <SimpleModal active={active} onClose={() => setActive(false)}>
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 'bold' }}>Custom Content Modal</h2>
            <p style={{ margin: '0 0 16px 0', color: '#666', fontSize: '14px' }}>This modal has custom content</p>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <Text>This modal demonstrates custom content handling.</Text>
          </div>
          <div
            style={{
              padding: '12px',
              backgroundColor: '#f5f5f5',
              borderRadius: '4px',
              marginBottom: '16px',
              fontSize: '14px'
            }}
          >
            <Text>This is an inset content area.</Text>
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button size='small' onClick={() => setActive(false)}>
              Cancel
            </Button>
            <Button
              size='small'
              onClick={() => {
                alert('Form submitted!')
                setActive(false)
              }}
            >
              Submit
            </Button>
          </div>
        </SimpleModal>
      </>
    )
  }
}

export const ModalWithoutActions: Story = {
  render: () => {
    const [active, setActive] = useState(false)

    return (
      <>
        <Button onClick={() => setActive(true)}>Open Modal without Actions</Button>
        <SimpleModal active={active} onClose={() => setActive(false)}>
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 'bold' }}>Modal without Actions</h2>
            <Text>This modal doesn't have action buttons. Click outside to close.</Text>
          </div>
        </SimpleModal>
      </>
    )
  }
}
