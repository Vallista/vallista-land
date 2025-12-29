import type { Meta, StoryObj } from '@storybook/react-vite'
import { Input } from './Input'
import { SearchInput } from './SearchInput'
import * as Icon from '../Icon/assets'

const meta: Meta<typeof Input> = {
  title: 'Components/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '입력 필드 컴포넌트입니다. 다양한 크기와 접두사/접미사를 지원합니다.'
      }
    }
  },
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['small', 'medium', 'large'],
      description: '입력 필드 크기'
    },
    type: {
      control: { type: 'select' },
      options: ['text', 'email', 'password', 'search', 'tel', 'url', 'number'],
      description: '입력 필드 타입'
    },
    disabled: {
      control: { type: 'boolean' },
      description: '비활성화 상태'
    },
    placeholder: {
      control: { type: 'text' },
      description: '플레이스홀더 텍스트'
    },
    prefixStyling: {
      control: { type: 'boolean' },
      description: '접두사 스타일링 적용 여부'
    },
    suffixStyling: {
      control: { type: 'boolean' },
      description: '접미사 스타일링 적용 여부'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
    size: 'medium'
  }
}

export const Small: Story = {
  args: {
    placeholder: 'Small input',
    size: 'small'
  }
}

export const Large: Story = {
  args: {
    placeholder: 'Large input',
    size: 'large'
  }
}

export const WithPrefix: Story = {
  args: {
    placeholder: 'Search...',
    prefix: <Icon.Check size={16} />,
    size: 'medium'
  }
}

export const WithSuffix: Story = {
  args: {
    placeholder: 'Enter email...',
    suffix: <Icon.AtSign size={16} />,
    size: 'medium'
  }
}

export const WithPrefixAndSuffix: Story = {
  args: {
    placeholder: 'Search with clear...',
    prefix: <Icon.Check size={16} />,
    suffix: <Icon.X size={16} />,
    size: 'medium'
  }
}

export const Disabled: Story = {
  args: {
    placeholder: 'Disabled input',
    disabled: true,
    size: 'medium'
  }
}

export const Email: Story = {
  args: {
    type: 'email',
    placeholder: 'Enter email address',
    size: 'medium'
  }
}

export const Password: Story = {
  args: {
    type: 'password',
    placeholder: 'Enter password',
    size: 'medium'
  }
}

export const Search: Story = {
  args: {
    type: 'search',
    placeholder: 'Search...',
    prefix: <Icon.Check size={16} />,
    size: 'medium'
  }
}

export const Number: Story = {
  args: {
    type: 'number',
    placeholder: 'Enter number',
    size: 'medium'
  }
}

export const WithoutPrefixStyling: Story = {
  args: {
    placeholder: 'Input without prefix styling',
    prefix: <Icon.Check size={16} />,
    prefixStyling: false,
    size: 'medium'
  }
}

export const WithoutSuffixStyling: Story = {
  args: {
    placeholder: 'Input without suffix styling',
    suffix: <Icon.X size={16} />,
    suffixStyling: false,
    size: 'medium'
  }
}

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Input placeholder='Small input' size='small' />
      <Input placeholder='Medium input' size='medium' />
      <Input placeholder='Large input' size='large' />
    </div>
  )
}

// SearchInput Stories
export const SearchInputDefault: Story = {
  render: () => <SearchInput placeholder='Search...' size='medium' />,
  parameters: {
    docs: {
      description: {
        story: '기본 SearchInput 컴포넌트입니다. 검색 아이콘과 리셋 버튼이 포함되어 있습니다.'
      }
    }
  }
}

export const SearchInputSmall: Story = {
  render: () => <SearchInput placeholder='Search...' size='small' />,
  parameters: {
    docs: {
      description: {
        story: '작은 크기의 SearchInput 컴포넌트입니다.'
      }
    }
  }
}

export const SearchInputLarge: Story = {
  render: () => <SearchInput placeholder='Search...' size='large' />,
  parameters: {
    docs: {
      description: {
        story: '큰 크기의 SearchInput 컴포넌트입니다.'
      }
    }
  }
}

export const SearchInputDisabled: Story = {
  render: () => <SearchInput placeholder='Search...' size='medium' disabled />,
  parameters: {
    docs: {
      description: {
        story: '비활성화된 SearchInput 컴포넌트입니다.'
      }
    }
  }
}

export const SearchInputWithValue: Story = {
  render: () => <SearchInput placeholder='Search...' size='medium' value='검색어' />,
  parameters: {
    docs: {
      description: {
        story: '값이 입력된 SearchInput 컴포넌트입니다. 리셋 버튼이 표시됩니다.'
      }
    }
  }
}

export const SearchInputAllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <SearchInput placeholder='Small search input' size='small' />
      <SearchInput placeholder='Medium search input' size='medium' />
      <SearchInput placeholder='Large search input' size='large' />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '모든 크기의 SearchInput 컴포넌트를 비교해볼 수 있습니다.'
      }
    }
  }
}
