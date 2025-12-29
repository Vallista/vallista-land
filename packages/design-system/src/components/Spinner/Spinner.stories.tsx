import type { Meta, StoryObj } from '@storybook/react-vite'
import { Spinner } from './index'

const meta: Meta<typeof Spinner> = {
  title: 'Components/Spinner',
  component: Spinner,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '로딩 상태를 나타내는 스피너 컴포넌트입니다.'
      }
    }
  },
  argTypes: {
    size: {
      control: { type: 'number' },
      description: '스피너 크기 (픽셀)'
    },
    'aria-label': {
      control: { type: 'text' },
      description: '접근성을 위한 라벨'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: '기본 스피너 컴포넌트입니다.'
      }
    }
  },
  args: {
    size: 30
  }
}

export const Small: Story = {
  parameters: {
    docs: {
      description: {
        story: '작은 크기의 스피너입니다.'
      }
    }
  },
  args: {
    size: 16
  }
}

export const Large: Story = {
  parameters: {
    docs: {
      description: {
        story: '큰 크기의 스피너입니다.'
      }
    }
  },
  args: {
    size: 48
  }
}

export const ExtraLarge: Story = {
  parameters: {
    docs: {
      description: {
        story: '매우 큰 크기의 스피너입니다.'
      }
    }
  },
  args: {
    size: 64
  }
}

export const CustomLabel: Story = {
  parameters: {
    docs: {
      description: {
        story: '사용자 정의 라벨이 있는 스피너입니다.'
      }
    }
  },
  args: {
    size: 30,
    'aria-label': 'Loading data...'
  }
}

export const AllSizes: Story = {
  parameters: {
    docs: {
      description: {
        story: '모든 크기의 스피너를 보여줍니다.'
      }
    }
  },
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <Spinner size={16} />
      <Spinner size={24} />
      <Spinner size={32} />
      <Spinner size={48} />
      <Spinner size={64} />
    </div>
  )
}

export const WithBackground: Story = {
  parameters: {
    docs: {
      description: {
        story: '배경이 있는 스피너 예시입니다.'
      }
    }
  },
  render: () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '24px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px'
      }}
    >
      <Spinner size={24} />
      <span>Loading...</span>
    </div>
  )
}
