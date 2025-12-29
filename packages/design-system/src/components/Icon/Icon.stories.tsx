import type { Meta, StoryObj } from '@storybook/react-vite'
import * as Icon from './assets'

const meta: Meta<typeof Icon.Activity> = {
  title: 'Components/Icon',
  component: Icon.Activity,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '아이콘 컴포넌트입니다. 다양한 아이콘들을 제공합니다.'
      }
    }
  },
  argTypes: {
    size: {
      control: { type: 'number' },
      description: '아이콘 크기'
    },
    color: {
      control: { type: 'color' },
      description: '아이콘 색상'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

// 기본 아이콘들
export const Activity: Story = {
  args: {
    size: 24,
    color: '#000000'
  },
  render: (args) => <Icon.Activity {...args} />
}

export const AlertCircle: Story = {
  args: {
    size: 24,
    color: '#ff0000'
  },
  render: (args) => <Icon.AlertCircle {...args} />
}

export const Check: Story = {
  args: {
    size: 24,
    color: '#00ff00'
  },
  render: (args) => <Icon.Check {...args} />
}

export const X: Story = {
  args: {
    size: 24,
    color: '#ff0000'
  },
  render: (args) => <Icon.X {...args} />
}

export const ArrowRight: Story = {
  args: {
    size: 24,
    color: '#0070f3'
  },
  render: (args) => <Icon.ArrowRight {...args} />
}

export const AtSign: Story = {
  args: {
    size: 24,
    color: '#0070f3'
  },
  render: (args) => <Icon.AtSign {...args} />
}

export const Bell: Story = {
  args: {
    size: 24,
    color: '#ff9900'
  },
  render: (args) => <Icon.Bell {...args} />
}

export const Camera: Story = {
  args: {
    size: 24,
    color: '#666666'
  },
  render: (args) => <Icon.Camera {...args} />
}

export const Calendar: Story = {
  args: {
    size: 24,
    color: '#0070f3'
  },
  render: (args) => <Icon.Calendar {...args} />
}

export const Book: Story = {
  args: {
    size: 24,
    color: '#8b4513'
  },
  render: (args) => <Icon.Book {...args} />
}

export const Battery: Story = {
  args: {
    size: 24,
    color: '#00ff00'
  },
  render: (args) => <Icon.Battery {...args} />
}

export const Cloud: Story = {
  args: {
    size: 24,
    color: '#87ceeb'
  },
  render: (args) => <Icon.Cloud {...args} />
}

export const Clock: Story = {
  args: {
    size: 24,
    color: '#666666'
  },
  render: (args) => <Icon.Clock {...args} />
}

export const Clipboard: Story = {
  args: {
    size: 24,
    color: '#0070f3'
  },
  render: (args) => <Icon.Clipboard {...args} />
}

export const Circle: Story = {
  args: {
    size: 24,
    color: '#000000'
  },
  render: (args) => <Icon.Circle {...args} />
}

// 크기별 아이콘
export const MultipleSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <Icon.Activity size={16} color='#000000' />
      <Icon.Activity size={24} color='#000000' />
      <Icon.Activity size={32} color='#000000' />
      <Icon.Activity size={48} color='#000000' />
    </div>
  )
}

// 화살표 아이콘들
export const ArrowIcons: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', maxWidth: '400px' }}>
      <Icon.ArrowUp size={24} color='#000000' />
      <Icon.ArrowDown size={24} color='#000000' />
      <Icon.ArrowLeft size={24} color='#000000' />
      <Icon.ArrowRight size={24} color='#000000' />
      <Icon.ArrowUpLeft size={24} color='#000000' />
      <Icon.ArrowUpRight size={24} color='#000000' />
      <Icon.ArrowDownLeft size={24} color='#000000' />
      <Icon.ArrowDownRight size={24} color='#000000' />
    </div>
  )
}

// 체브론 아이콘들
export const ChevronIcons: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', maxWidth: '400px' }}>
      <Icon.ChevronUp size={24} color='#000000' />
      <Icon.ChevronDown size={24} color='#000000' />
      <Icon.ChevronLeft size={24} color='#000000' />
      <Icon.ChevronRight size={24} color='#000000' />
      <Icon.ChevronUpCircle size={24} color='#000000' />
      <Icon.ChevronDownCircle size={24} color='#000000' />
      <Icon.ChevronLeftCircle size={24} color='#000000' />
      <Icon.ChevronRightCircle size={24} color='#000000' />
    </div>
  )
}

// 체크 관련 아이콘들
export const CheckIcons: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', maxWidth: '400px' }}>
      <Icon.Check size={24} color='#00ff00' />
      <Icon.CheckCircle size={24} color='#00ff00' />
      <Icon.CheckInCircle size={24} color='#00ff00' />
      <Icon.CheckSquare size={24} color='#00ff00' />
      <Icon.CheckBox size={24} color='#00ff00' />
    </div>
  )
}

// 알림 관련 아이콘들
export const AlertIcons: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', maxWidth: '300px' }}>
      <Icon.AlertCircle size={24} color='#ff0000' />
      <Icon.AlertTriangle size={24} color='#ff9900' />
      <Icon.AlertOctagon size={24} color='#ff6600' />
    </div>
  )
}

// 클라우드 관련 아이콘들
export const CloudIcons: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', maxWidth: '400px' }}>
      <Icon.Cloud size={24} color='#87ceeb' />
      <Icon.CloudDrizzle size={24} color='#87ceeb' />
      <Icon.CloudLightning size={24} color='#87ceeb' />
      <Icon.CloudOff size={24} color='#87ceeb' />
      <Icon.CloudRain size={24} color='#87ceeb' />
      <Icon.CloudSnow size={24} color='#87ceeb' />
    </div>
  )
}

// 통계/차트 아이콘들
export const ChartIcons: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', maxWidth: '300px' }}>
      <Icon.BarChart size={24} color='#0070f3' />
      <Icon.BarChart2 size={24} color='#0070f3' />
      <Icon.Activity size={24} color='#0070f3' />
    </div>
  )
}

// 전체 아이콘 그리드 (주요 아이콘들)
export const IconGrid: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '16px', maxWidth: '800px' }}>
      <Icon.Activity size={24} color='#000000' />
      <Icon.AlertCircle size={24} color='#ff0000' />
      <Icon.Check size={24} color='#00ff00' />
      <Icon.X size={24} color='#ff0000' />
      <Icon.ArrowRight size={24} color='#0070f3' />
      <Icon.AtSign size={24} color='#0070f3' />
      <Icon.Bell size={24} color='#ff9900' />
      <Icon.Camera size={24} color='#666666' />
      <Icon.Calendar size={24} color='#0070f3' />
      <Icon.Book size={24} color='#8b4513' />
      <Icon.Battery size={24} color='#00ff00' />
      <Icon.Cloud size={24} color='#87ceeb' />
      <Icon.Clock size={24} color='#666666' />
      <Icon.Clipboard size={24} color='#0070f3' />
      <Icon.Circle size={24} color='#000000' />
      <Icon.ArrowUp size={24} color='#000000' />
      <Icon.ArrowDown size={24} color='#000000' />
      <Icon.ArrowLeft size={24} color='#000000' />
      <Icon.ChevronUp size={24} color='#000000' />
      <Icon.ChevronDown size={24} color='#000000' />
      <Icon.ChevronLeft size={24} color='#000000' />
      <Icon.ChevronRight size={24} color='#000000' />
      <Icon.CheckCircle size={24} color='#00ff00' />
      <Icon.AlertTriangle size={24} color='#ff9900' />
      <Icon.CloudRain size={24} color='#87ceeb' />
      <Icon.BarChart2 size={24} color='#0070f3' />
    </div>
  )
}
