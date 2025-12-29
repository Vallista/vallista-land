import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Progress } from './index'
import { Button } from '../Button'

const meta: Meta<typeof Progress> = {
  title: 'Components/Progress',
  component: Progress,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '진행상황을 표시하는 프로그레스 컴포넌트입니다.'
      }
    }
  },
  argTypes: {
    type: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'success', 'error', 'warning'],
      description: '프로그레스 타입'
    },
    value: {
      control: { type: 'range', min: 0, max: 100 },
      description: '현재 값'
    },
    max: {
      control: { type: 'number' },
      description: '최대 값'
    },
    width: {
      control: { type: 'text' },
      description: '프로그레스 바의 너비'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div style={{ width: '300px' }}>
      <Progress type='primary' value={50} max={100} />
    </div>
  )
}

export const Primary: Story = {
  render: () => (
    <div style={{ width: '300px' }}>
      <Progress type='primary' value={75} max={100} />
    </div>
  )
}

export const Secondary: Story = {
  render: () => (
    <div style={{ width: '300px' }}>
      <Progress type='secondary' value={60} max={100} />
    </div>
  )
}

export const Success: Story = {
  render: () => (
    <div style={{ width: '300px' }}>
      <Progress type='success' value={90} max={100} />
    </div>
  )
}

export const Error: Story = {
  render: () => (
    <div style={{ width: '300px' }}>
      <Progress type='error' value={25} max={100} />
    </div>
  )
}

export const Warning: Story = {
  render: () => (
    <div style={{ width: '300px' }}>
      <Progress type='warning' value={40} max={100} />
    </div>
  )
}

export const WithColors: Story = {
  render: () => (
    <div style={{ width: '300px' }}>
      <Progress
        type='primary'
        value={50}
        max={100}
        colors={{
          0: '#e5e7eb',
          25: '#fbbf24',
          50: '#f59e0b',
          75: '#d97706',
          100: '#92400e'
        }}
      />
    </div>
  )
}

export const CustomWidth: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
      <Progress type='primary' value={50} max={100} width='200px' />
      <Progress type='success' value={75} max={100} width='400px' />
      <Progress type='error' value={25} max={100} width='150px' />
    </div>
  )
}

export const SimpleTest: Story = {
  render: () => (
    <div style={{ width: '300px', padding: '20px' }}>
      <h3>Progress Test</h3>
      <Progress type='primary' value={50} max={100} />
      <br />
      <Progress type='success' value={75} max={100} />
      <br />
      <Progress type='error' value={25} max={100} />
    </div>
  )
}

export const Interactive: Story = {
  render: () => {
    const [value, setValue] = useState(50)

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '300px' }}>
        <Progress type='primary' value={value} max={100} />
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button size='small' onClick={() => setValue(Math.max(0, value - 10))}>
            Decrease
          </Button>
          <Button size='small' onClick={() => setValue(Math.min(100, value + 10))}>
            Increase
          </Button>
        </div>
        <div>Value: {value}%</div>
      </div>
    )
  }
}

export const AllTypes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '300px' }}>
      <Progress type='primary' value={75} max={100} />
      <Progress type='secondary' value={60} max={100} />
      <Progress type='success' value={90} max={100} />
      <Progress type='error' value={25} max={100} />
      <Progress type='warning' value={40} max={100} />
    </div>
  )
}

export const DifferentValues: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '300px' }}>
      <Progress type='primary' value={0} max={100} />
      <Progress type='primary' value={25} max={100} />
      <Progress type='primary' value={50} max={100} />
      <Progress type='primary' value={75} max={100} />
      <Progress type='primary' value={100} max={100} />
    </div>
  )
}
