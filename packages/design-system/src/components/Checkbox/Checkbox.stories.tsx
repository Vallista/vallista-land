import type { Meta, StoryObj } from '@storybook/react-vite'
import { Checkbox } from './Checkbox'

const meta: Meta<typeof Checkbox> = {
  title: 'Components/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '체크박스 컴포넌트입니다. 체크, 비체크, 불확정 상태를 지원합니다.'
      }
    }
  },
  argTypes: {
    checked: {
      control: { type: 'boolean' },
      description: '체크 상태'
    },
    indeterminate: {
      control: { type: 'boolean' },
      description: '불확정 상태'
    },
    disabled: {
      control: { type: 'boolean' },
      description: '비활성화 상태'
    },
    fullWidth: {
      control: { type: 'boolean' },
      description: '전체 너비 사용'
    },
    label: {
      control: { type: 'text' },
      description: '라벨 텍스트'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: '기본 체크박스 컴포넌트입니다.'
      }
    }
  },
  args: {
    label: 'Checkbox'
  }
}

export const Checked: Story = {
  parameters: {
    docs: {
      description: {
        story: '체크된 상태의 체크박스입니다.'
      }
    }
  },
  args: {
    checked: true,
    label: 'Checked Checkbox'
  }
}

export const Indeterminate: Story = {
  parameters: {
    docs: {
      description: {
        story: '불확정 상태의 체크박스입니다.'
      }
    }
  },
  args: {
    indeterminate: true,
    label: 'Indeterminate Checkbox'
  }
}

export const Disabled: Story = {
  parameters: {
    docs: {
      description: {
        story: '비활성화된 체크박스입니다.'
      }
    }
  },
  args: {
    disabled: true,
    label: 'Disabled Checkbox'
  }
}

export const DisabledChecked: Story = {
  parameters: {
    docs: {
      description: {
        story: '체크된 상태이면서 비활성화된 체크박스입니다.'
      }
    }
  },
  args: {
    checked: true,
    disabled: true,
    label: 'Disabled Checked Checkbox'
  }
}

export const FullWidth: Story = {
  parameters: {
    docs: {
      description: {
        story: '전체 너비를 사용하는 체크박스입니다.'
      }
    }
  },
  args: {
    fullWidth: true,
    label: 'Full Width Checkbox'
  }
}

export const WithoutLabel: Story = {
  parameters: {
    docs: {
      description: {
        story: '라벨이 없는 체크박스입니다.'
      }
    }
  },
  args: {
    label: ''
  }
}
