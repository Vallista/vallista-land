import type { Meta, StoryObj } from '@storybook/react-vite'
import { Badge } from './index'

const meta: Meta<typeof Badge> = {
  title: 'Components/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '배지 컴포넌트입니다. 다양한 타입과 크기를 지원합니다.'
      }
    }
  },
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['small', 'normal', 'large'],
      description: '배지 크기'
    },
    type: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'success', 'error', 'warning', 'violet'],
      description: '배지 타입'
    },
    variant: {
      control: { type: 'select' },
      options: ['primary', 'contrast'],
      description: '배지 변형'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Badge',
    size: 'normal',
    type: 'primary',
    variant: 'primary'
  }
}

export const Primary: Story = {
  args: {
    children: 'Primary',
    type: 'primary'
  }
}

export const Secondary: Story = {
  args: {
    children: 'Secondary',
    type: 'secondary'
  }
}

export const Success: Story = {
  args: {
    children: 'Success',
    type: 'success'
  }
}

export const Error: Story = {
  args: {
    children: 'Error',
    type: 'error'
  }
}

export const Warning: Story = {
  args: {
    children: 'Warning',
    type: 'warning'
  }
}

export const Violet: Story = {
  args: {
    children: 'Violet',
    type: 'violet'
  }
}

export const Contrast: Story = {
  args: {
    children: 'Contrast',
    variant: 'contrast'
  }
}

export const Small: Story = {
  args: {
    children: 'Small',
    size: 'small'
  }
}

export const Large: Story = {
  args: {
    children: 'Large',
    size: 'large'
  }
}

export const AllTypes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      <Badge type='primary'>Primary</Badge>
      <Badge type='secondary'>Secondary</Badge>
      <Badge type='success'>Success</Badge>
      <Badge type='error'>Error</Badge>
      <Badge type='warning'>Warning</Badge>
      <Badge type='violet'>Violet</Badge>
    </div>
  )
}

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Badge size='small'>Small</Badge>
      <Badge size='normal'>Normal</Badge>
      <Badge size='large'>Large</Badge>
    </div>
  )
}

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      <Badge variant='primary'>Primary</Badge>
      <Badge variant='contrast'>Contrast</Badge>
    </div>
  )
}
