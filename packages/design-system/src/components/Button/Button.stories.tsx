import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'
import * as Icon from '../Icon/assets'

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '기본적인 버튼 컴포넌트입니다. 다양한 크기, 색상, 변형을 지원합니다.'
      }
    }
  },
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['small', 'medium', 'large'],
      description: '버튼 크기'
    },
    variant: {
      control: { type: 'select' },
      options: ['ghost', 'shadow', 'default'],
      description: '버튼 스타일 변형'
    },
    color: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'success', 'error'],
      description: '버튼 색상'
    },
    shape: {
      control: { type: 'select' },
      options: ['square', 'circle'],
      description: '버튼 모양'
    },
    disabled: {
      control: { type: 'boolean' },
      description: '비활성화 상태'
    },
    loading: {
      control: { type: 'boolean' },
      description: '로딩 상태'
    },
    block: {
      control: { type: 'boolean' },
      description: '전체 너비 사용'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: '기본 버튼 컴포넌트입니다.'
      }
    }
  },
  args: {
    children: 'Button',
    size: 'medium',
    variant: 'default',
    color: 'primary'
  }
}

export const Small: Story = {
  parameters: {
    docs: {
      description: {
        story: '작은 크기의 버튼입니다.'
      }
    }
  },
  args: {
    children: 'Small Button',
    size: 'small'
  }
}

export const Large: Story = {
  parameters: {
    docs: {
      description: {
        story: '큰 크기의 버튼입니다.'
      }
    }
  },
  args: {
    children: 'Large Button',
    size: 'large'
  }
}

export const Ghost: Story = {
  parameters: {
    docs: {
      description: {
        story: '고스트 스타일의 버튼입니다.'
      }
    }
  },
  args: {
    children: 'Ghost Button',
    variant: 'ghost'
  }
}

export const Shadow: Story = {
  parameters: {
    docs: {
      description: {
        story: '그림자가 있는 버튼입니다.'
      }
    }
  },
  args: {
    children: 'Shadow Button',
    variant: 'shadow'
  }
}

export const Secondary: Story = {
  parameters: {
    docs: {
      description: {
        story: '보조 색상의 버튼입니다.'
      }
    }
  },
  args: {
    children: 'Secondary Button',
    color: 'secondary'
  }
}

export const Success: Story = {
  parameters: {
    docs: {
      description: {
        story: '성공 상태의 버튼입니다.'
      }
    }
  },
  args: {
    children: 'Success Button',
    color: 'success'
  }
}

export const Error: Story = {
  parameters: {
    docs: {
      description: {
        story: '에러 상태의 버튼입니다.'
      }
    }
  },
  args: {
    children: 'Error Button',
    color: 'error'
  }
}

export const Disabled: Story = {
  parameters: {
    docs: {
      description: {
        story: '비활성화된 버튼입니다.'
      }
    }
  },
  args: {
    children: 'Disabled Button',
    disabled: true
  }
}

export const Loading: Story = {
  parameters: {
    docs: {
      description: {
        story: '로딩 상태의 버튼입니다.'
      }
    }
  },
  args: {
    children: 'Loading Button',
    loading: true
  }
}

export const WithIcon: Story = {
  parameters: {
    docs: {
      description: {
        story: '아이콘이 포함된 버튼입니다.'
      }
    }
  },
  args: {
    children: (
      <>
        <Icon.Check size={16} />
        Button with Icon
      </>
    )
  }
}

export const IconOnly: Story = {
  parameters: {
    docs: {
      description: {
        story: '아이콘만 있는 버튼입니다.'
      }
    }
  },
  args: {
    children: <Icon.Check size={16} />,
    shape: 'circle'
  }
}

export const Block: Story = {
  parameters: {
    docs: {
      description: {
        story: '전체 너비를 사용하는 버튼입니다.'
      }
    }
  },
  args: {
    children: 'Block Button',
    block: true
  }
}

export const AllColors: Story = {
  parameters: {
    docs: {
      description: {
        story: '모든 색상 변형을 보여줍니다.'
      }
    }
  },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <Button color='primary'>Primary</Button>
      <Button color='secondary'>Secondary</Button>
      <Button color='success'>Success</Button>
      <Button color='error'>Error</Button>
    </div>
  )
}

export const AllSizes: Story = {
  parameters: {
    docs: {
      description: {
        story: '모든 크기 변형을 보여줍니다.'
      }
    }
  },
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Button size='small'>Small</Button>
      <Button size='medium'>Medium</Button>
      <Button size='large'>Large</Button>
    </div>
  )
}

export const AllVariants: Story = {
  parameters: {
    docs: {
      description: {
        story: '모든 스타일 변형을 보여줍니다.'
      }
    }
  },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <Button variant='default'>Default</Button>
      <Button variant='ghost'>Ghost</Button>
      <Button variant='shadow'>Shadow</Button>
    </div>
  )
}

export const ColorTest: Story = {
  parameters: {
    docs: {
      description: {
        story: '색상 변경 테스트입니다.'
      }
    }
  },
  render: () => {
    const getCSSVariables = () => {
      const root = document.documentElement
      const computedStyle = getComputedStyle(root)
      return {
        primaryBackground: computedStyle.getPropertyValue('--primary-background'),
        primaryForeground: computedStyle.getPropertyValue('--primary-foreground'),
        primaryAccent2: computedStyle.getPropertyValue('--primary-accent-2'),
        primaryAccent5: computedStyle.getPropertyValue('--primary-accent-5'),
        successDefault: computedStyle.getPropertyValue('--success-default'),
        errorDefault: computedStyle.getPropertyValue('--error-default')
      }
    }

    return (
      <div style={{ padding: '16px', border: '1px solid #ccc' }}>
        <h3>CSS Variables Debug</h3>
        <pre>{JSON.stringify(getCSSVariables(), null, 2)}</pre>
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Button color='primary'>Primary Button</Button>
          <Button color='secondary'>Secondary Button</Button>
          <Button color='success'>Success Button</Button>
          <Button color='error'>Error Button</Button>
        </div>
      </div>
    )
  }
}

export const CSSVariablesDebug: Story = {
  parameters: {
    docs: {
      description: {
        story: 'CSS 변수 디버깅을 위한 스토리입니다.'
      }
    }
  },
  render: () => {
    const getCSSVariables = () => {
      const root = document.documentElement
      const computedStyle = getComputedStyle(root)
      return {
        primaryBackground: computedStyle.getPropertyValue('--primary-background'),
        primaryForeground: computedStyle.getPropertyValue('--primary-foreground'),
        primaryAccent2: computedStyle.getPropertyValue('--primary-accent-2'),
        primaryAccent5: computedStyle.getPropertyValue('--primary-accent-5'),
        successDefault: computedStyle.getPropertyValue('--success-default'),
        errorDefault: computedStyle.getPropertyValue('--error-default')
      }
    }

    return (
      <div style={{ padding: '16px', border: '1px solid #ccc' }}>
        <h3>CSS Variables Debug</h3>
        <pre>{JSON.stringify(getCSSVariables(), null, 2)}</pre>
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Button color='primary'>Primary Button</Button>
          <Button color='secondary'>Secondary Button</Button>
          <Button color='success'>Success Button</Button>
          <Button color='error'>Error Button</Button>
        </div>
      </div>
    )
  }
}
