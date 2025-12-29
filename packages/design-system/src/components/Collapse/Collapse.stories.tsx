import type { Meta, StoryObj } from '@storybook/react-vite'
import { Collapse, CollapseGroup } from './index'
import { Text } from '../Text'

const meta: Meta<typeof Collapse> = {
  title: 'Components/Collapse',
  component: Collapse,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '접을 수 있는 컨텐츠 영역 컴포넌트입니다.'
      }
    }
  },
  argTypes: {
    title: {
      control: { type: 'text' },
      description: '제목'
    },
    subtitle: {
      control: { type: 'text' },
      description: '부제목'
    },
    defaultExpanded: {
      control: { type: 'boolean' },
      description: '기본 펼침 상태'
    },
    size: {
      control: { type: 'select' },
      options: ['small', 'medium'],
      description: '크기'
    },
    card: {
      control: { type: 'boolean' },
      description: '카드 스타일'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: '기본 Collapse 컴포넌트입니다.'
      }
    }
  },
  args: {
    title: 'Collapse Title',
    subtitle: 'Optional subtitle',
    defaultExpanded: true,
    size: 'medium',
    card: false,
    children: <Text>This is collapsible content that can be shown or hidden.</Text>
  }
}

export const Small: Story = {
  parameters: {
    docs: {
      description: {
        story: '작은 크기의 Collapse 컴포넌트입니다.'
      }
    }
  },
  args: {
    title: 'Small Collapse',
    subtitle: 'Small size example',
    defaultExpanded: false,
    size: 'small',
    card: false,
    children: <Text>This is a small collapse component.</Text>
  }
}

export const Card: Story = {
  parameters: {
    docs: {
      description: {
        story: '카드 스타일의 Collapse 컴포넌트입니다.'
      }
    }
  },
  args: {
    title: 'Card Style',
    subtitle: 'Card style example',
    defaultExpanded: true,
    size: 'medium',
    card: true,
    children: <Text>This collapse has a card style appearance.</Text>
  }
}

export const LongContent: Story = {
  parameters: {
    docs: {
      description: {
        story: '긴 콘텐츠를 포함한 Collapse 컴포넌트입니다.'
      }
    }
  },
  args: {
    title: 'Long Content Example',
    subtitle: 'Demonstrates handling of longer content',
    defaultExpanded: true,
    size: 'medium',
    card: false,
    children: (
      <div>
        <Text>
          This is a longer piece of content that demonstrates how the collapse component handles larger amounts of text
          and multiple elements.
        </Text>
        <Text>
          The component can contain various types of content including paragraphs, lists, and other components.
        </Text>
        <ul>
          <li>First item in the list</li>
          <li>Second item with more details</li>
          <li>Third item showing the flexibility</li>
        </ul>
        <Text>More content to show the full functionality of the collapse component.</Text>
      </div>
    )
  }
}

export const Group: Story = {
  parameters: {
    docs: {
      description: {
        story: 'CollapseGroup을 사용한 여러 Collapse 컴포넌트입니다.'
      }
    }
  },
  render: () => (
    <div style={{ width: '500px' }}>
      <CollapseGroup>
        <Collapse title='Question A' defaultExpanded={true}>
          <Text>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
            dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
            ea commodo consequat.
          </Text>
        </Collapse>
        <Collapse title='Question B' defaultExpanded={false}>
          <Text>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
            dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
            ea commodo consequat.
          </Text>
        </Collapse>
        <Collapse title='Question C' defaultExpanded={false}>
          <Text>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
            dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
            ea commodo consequat.
          </Text>
        </Collapse>
      </CollapseGroup>
    </div>
  )
}

export const MultipleCollapses: Story = {
  parameters: {
    docs: {
      description: {
        story: '독립적인 여러 Collapse 컴포넌트입니다.'
      }
    }
  },
  render: () => (
    <div style={{ width: '500px' }}>
      <Collapse title='First Collapse' defaultExpanded={true}>
        <Text>This is the first independent collapse component.</Text>
      </Collapse>
      <Collapse title='Second Collapse' defaultExpanded={false}>
        <Text>This is the second independent collapse component.</Text>
      </Collapse>
      <Collapse title='Third Collapse' defaultExpanded={false}>
        <Text>This is the third independent collapse component.</Text>
      </Collapse>
    </div>
  )
}
