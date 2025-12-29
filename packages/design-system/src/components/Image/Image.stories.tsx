import type { Meta, StoryObj } from '@storybook/react-vite'
import { Image } from './index'

const meta: Meta<typeof Image> = {
  title: 'Components/Image',
  component: Image,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '이미지를 표시하는 컴포넌트입니다. 로딩 시 fade-in 애니메이션을 제공하고, 선택적으로 헤더와 닫기 버튼을 포함할 수 있습니다.'
      }
    }
  },
  argTypes: {
    src: {
      control: { type: 'text' },
      description: '이미지 소스 URL'
    },
    width: {
      control: { type: 'number', min: 100, max: 1000 },
      description: '이미지 너비'
    },
    height: {
      control: { type: 'number', min: 100, max: 1000 },
      description: '이미지 높이'
    },
    margin: {
      control: { type: 'number', min: 0, max: 100 },
      description: '이미지 마진'
    },
    caption: {
      control: { type: 'text' },
      description: '이미지 캡션'
    },
    captionSpacing: {
      control: { type: 'number', min: 0, max: 100 },
      description: '캡션과 이미지 간 간격'
    },
    objectFit: {
      control: { type: 'select' },
      options: ['contain', 'cover', 'fill', 'none', 'scale-down'],
      description: '이미지 맞춤 방식'
    },
    objectPosition: {
      control: { type: 'text' },
      description: '이미지 위치'
    },
    title: {
      control: { type: 'text' },
      description: '이미지 제목 (헤더에 표시)'
    },
    onClose: {
      action: 'closed',
      description: '닫기 버튼 클릭 시 호출되는 함수'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: '기본 Image 컴포넌트입니다.'
      }
    }
  },
  args: {
    src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=540&h=300&fit=crop&crop=center',
    width: 540,
    height: 300,
    margin: 0
  }
}

export const WithCaption: Story = {
  parameters: {
    docs: {
      description: {
        story: '캡션이 있는 이미지입니다.'
      }
    }
  },
  args: {
    src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=540&h=300&fit=crop&crop=center',
    width: 540,
    height: 300,
    margin: 0,
    caption: 'Source: Unsplash - Mountain Landscape',
    captionSpacing: 20
  }
}

export const WithHeader: Story = {
  parameters: {
    docs: {
      description: {
        story: '헤더와 닫기 버튼이 있는 이미지입니다. 제목과 x 버튼이 붙어서 배치됩니다.'
      }
    }
  },
  args: {
    src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=540&h=300&fit=crop&crop=center',
    width: 540,
    height: 300,
    margin: 0,
    title: 'Mountain Landscape',
    caption: 'Source: Unsplash',
    captionSpacing: 20
  }
}

export const WithHeaderAndClose: Story = {
  parameters: {
    docs: {
      description: {
        story: '헤더, 제목, 닫기 버튼이 모두 있는 이미지입니다. x 버튼을 클릭하면 onClose 함수가 호출됩니다.'
      }
    }
  },
  args: {
    src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=540&h=300&fit=crop&crop=center',
    width: 540,
    height: 300,
    margin: 0,
    title: 'Mountain Landscape',
    caption: 'Source: Unsplash',
    captionSpacing: 20
  }
}

export const Small: Story = {
  parameters: {
    docs: {
      description: {
        story: '작은 크기의 이미지입니다.'
      }
    }
  },
  args: {
    src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&h=200&fit=crop&crop=center',
    width: 300,
    height: 200,
    margin: 16
  }
}

export const Large: Story = {
  parameters: {
    docs: {
      description: {
        story: '큰 크기의 이미지입니다.'
      }
    }
  },
  args: {
    src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop&crop=center',
    width: 800,
    height: 400,
    margin: 24
  }
}

export const WithObjectFit: Story = {
  parameters: {
    docs: {
      description: {
        story: 'object-fit 속성을 사용한 이미지입니다.'
      }
    }
  },
  args: {
    src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=600&fit=crop&crop=center',
    width: 300,
    height: 300,
    margin: 16,
    objectFit: 'cover',
    objectPosition: 'center'
  }
}

export const Square: Story = {
  parameters: {
    docs: {
      description: {
        story: '정사각형 이미지입니다.'
      }
    }
  },
  args: {
    src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop&crop=center',
    width: 400,
    height: 400,
    margin: 16
  }
}

export const Portrait: Story = {
  parameters: {
    docs: {
      description: {
        story: '세로형 이미지입니다.'
      }
    }
  },
  args: {
    src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&h=500&fit=crop&crop=center',
    width: 300,
    height: 500,
    margin: 16,
    caption: 'Portrait Image',
    captionSpacing: 12
  }
}

export const Landscape: Story = {
  parameters: {
    docs: {
      description: {
        story: '가로형 이미지입니다.'
      }
    }
  },
  args: {
    src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=300&fit=crop&crop=center',
    width: 600,
    height: 300,
    margin: 16,
    caption: 'Landscape Image',
    captionSpacing: 12
  }
}
