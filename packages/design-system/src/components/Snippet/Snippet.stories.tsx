import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Snippet } from './index'

const meta: Meta<typeof Snippet> = {
  title: 'Components/Snippet',
  component: Snippet,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '코드를 쉽게 공유할 수 있는 스니펫 컴포넌트입니다. 복사 버튼을 클릭하면 클립보드에 복사됩니다.'
      }
    }
  },
  argTypes: {
    type: {
      control: { type: 'select' },
      options: ['success', 'error', 'warning', 'primary', 'secondary', 'lite'],
      description: '스니펫 타입'
    },
    width: {
      control: { type: 'text' },
      description: '스니펫 너비'
    },
    fill: {
      control: { type: 'boolean' },
      description: '전체 너비 사용'
    },
    dark: {
      control: { type: 'boolean' },
      description: '다크 모드'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => <Snippet text='npm install @vallista/design-system' width='400px' type='primary' />
}

export const Success: Story = {
  render: () => <Snippet text='✅ Installation completed successfully!' width='400px' type='success' />
}

export const Error: Story = {
  render: () => <Snippet text='❌ Error: Package not found' width='400px' type='error' />
}

export const Warning: Story = {
  render: () => <Snippet text='⚠️ Warning: Deprecated package detected' width='400px' type='warning' />
}

export const MultiLine: Story = {
  render: () => (
    <Snippet
      text={['npm install @vallista/design-system', 'npm run dev', 'npm run build']}
      width='400px'
      type='primary'
    />
  )
}

export const DarkMode: Story = {
  render: () => (
    <div style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '8px' }}>
      <Snippet text='npm install @vallista/design-system' width='400px' type='primary' dark />
    </div>
  )
}

export const FillWidth: Story = {
  render: () => (
    <div style={{ width: '100%', maxWidth: '600px' }}>
      <Snippet text='npm install @vallista/design-system' type='primary' fill />
    </div>
  )
}

export const AllTypes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '400px' }}>
      <Snippet text='Primary snippet' type='primary' />
      <Snippet text='Secondary snippet' type='secondary' />
      <Snippet text='Success snippet' type='success' />
      <Snippet text='Error snippet' type='error' />
      <Snippet text='Warning snippet' type='warning' />
      <Snippet text='Lite snippet' type='lite' />
    </div>
  )
}

export const LongCode: Story = {
  render: () => (
    <Snippet
      text={[
        'function fibonacci(n) {',
        '  if (n <= 1) return n;',
        '  return fibonacci(n - 1) + fibonacci(n - 2);',
        '}',
        '',
        'console.log(fibonacci(10)); // 55'
      ]}
      width='500px'
      type='primary'
    />
  )
}

export const Interactive: Story = {
  render: () => {
    const [copyStatus, setCopyStatus] = useState<string>('')

    const handleCopy = () => {
      setCopyStatus('✅ Copied to clipboard!')
      setTimeout(() => setCopyStatus(''), 2000)
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Snippet text='Click the copy button to copy this text!' width='400px' type='primary' onCopy={handleCopy} />

        <div style={{ padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px', fontSize: '14px' }}>
          <strong>Tip:</strong> Click the copy icon to copy the snippet text to clipboard.
          {copyStatus && <div style={{ marginTop: '8px', color: '#28a745', fontWeight: 'bold' }}>{copyStatus}</div>}
        </div>
      </div>
    )
  }
}

export const WithCopyCallback: Story = {
  render: () => {
    const [copyCount, setCopyCount] = useState(0)

    const handleCopy = () => {
      setCopyCount((prev) => prev + 1)
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Snippet
          text='npm install @vallista/design-system && npm run dev'
          width='400px'
          type='success'
          onCopy={handleCopy}
        />

        <div style={{ padding: '12px', backgroundColor: '#e8f5e8', borderRadius: '4px', fontSize: '14px' }}>
          <strong>Copy count:</strong> {copyCount} time{copyCount !== 1 ? 's' : ''}
        </div>
      </div>
    )
  }
}
