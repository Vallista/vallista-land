import type { Meta, StoryObj } from '@storybook/react-vite'
import { Capacity } from './index'

const meta: Meta<typeof Capacity> = {
  title: 'Components/Capacity',
  component: Capacity,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '작은 게이지를 표시하는 컴포넌트입니다.'
      }
    }
  },
  argTypes: {
    value: {
      control: { type: 'number', min: 0, max: 100 },
      description: '현재 값'
    },
    limit: {
      control: { type: 'number', min: 1 },
      description: '최대 값 (기본값: 100)'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: '기본 Capacity 컴포넌트입니다.'
      }
    }
  },
  args: {
    value: 50,
    limit: 100
  }
}

export const Low: Story = {
  parameters: {
    docs: {
      description: {
        story: '낮은 값 (33% 미만)을 표시합니다.'
      }
    }
  },
  args: {
    value: 25,
    limit: 100
  }
}

export const Medium: Story = {
  parameters: {
    docs: {
      description: {
        story: '중간 값 (33-66%)을 표시합니다.'
      }
    }
  },
  args: {
    value: 50,
    limit: 100
  }
}

export const High: Story = {
  parameters: {
    docs: {
      description: {
        story: '높은 값 (66% 이상)을 표시합니다.'
      }
    }
  },
  args: {
    value: 85,
    limit: 100
  }
}

export const Full: Story = {
  parameters: {
    docs: {
      description: {
        story: '최대값을 표시합니다.'
      }
    }
  },
  args: {
    value: 100,
    limit: 100
  }
}

export const CustomLimit: Story = {
  parameters: {
    docs: {
      description: {
        story: '사용자 정의 최대값을 사용합니다.'
      }
    }
  },
  args: {
    value: 75,
    limit: 200
  }
}

export const MultipleCapacities: Story = {
  parameters: {
    docs: {
      description: {
        story: '여러 Capacity 컴포넌트를 보여줍니다.'
      }
    }
  },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <Capacity value={10} />
      <Capacity value={25} />
      <Capacity value={50} />
      <Capacity value={75} />
      <Capacity value={90} />
      <Capacity value={100} />
    </div>
  )
}
