import type { Meta, StoryObj } from '@storybook/react-vite'
import { Video } from './index'

const meta: Meta<typeof Video> = {
  title: 'Components/Video',
  component: Video,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '비디오 플레이어 컴포넌트입니다. 재생, 일시정지, 전체화면, 프로그레스바 기능을 제공합니다.'
      }
    }
  },
  argTypes: {
    src: {
      control: { type: 'text' },
      description: '비디오 소스 URL'
    },
    width: {
      control: { type: 'number' },
      description: '비디오 너비'
    },
    height: {
      control: { type: 'number' },
      description: '비디오 높이'
    },
    fullscreenable: {
      control: { type: 'boolean' },
      description: '전체화면 기능 활성화'
    },
    autoPlay: {
      control: { type: 'boolean' },
      description: '자동 재생'
    },
    loop: {
      control: { type: 'boolean' },
      description: '반복 재생'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
      <h3 style={{ marginBottom: '16px', color: '#333' }}>기본 비디오 플레이어</h3>
      <Video
        src='https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
        width={640}
        height={360}
      />
    </div>
  )
}

export const WithAutoPlay: Story = {
  render: () => (
    <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
      <h3 style={{ marginBottom: '16px', color: '#333' }}>자동 재생 비디오</h3>
      <Video
        src='https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
        width={640}
        height={360}
        autoPlay
        muted
      />
    </div>
  )
}

export const WithLoop: Story = {
  render: () => (
    <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
      <h3 style={{ marginBottom: '16px', color: '#333' }}>반복 재생 비디오</h3>
      <Video
        src='https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
        width={640}
        height={360}
        loop
      />
    </div>
  )
}

export const DisableFullscreen: Story = {
  render: () => (
    <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
      <h3 style={{ marginBottom: '16px', color: '#333' }}>전체화면 비활성화</h3>
      <p style={{ marginBottom: '16px', color: '#666', fontSize: '14px' }}>
        전체화면 기능이 비활성화된 비디오입니다. 전체화면 버튼이 표시되지 않습니다.
      </p>
      <Video
        src='https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
        width={640}
        height={360}
        fullscreenable={false}
      />
    </div>
  )
}

export const SmallSize: Story = {
  render: () => (
    <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
      <h3 style={{ marginBottom: '16px', color: '#333' }}>작은 크기 비디오</h3>
      <Video
        src='https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
        width={320}
        height={180}
      />
    </div>
  )
}

export const LargeSize: Story = {
  render: () => (
    <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
      <h3 style={{ marginBottom: '16px', color: '#333' }}>큰 크기 비디오</h3>
      <Video
        src='https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4'
        width={800}
        height={450}
      />
    </div>
  )
}

export const MultipleVideos: Story = {
  render: () => (
    <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
      <h3 style={{ marginBottom: '16px', color: '#333' }}>여러 비디오</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div>
          <h4 style={{ marginBottom: '8px', color: '#666' }}>비디오 1 (전체화면 활성화)</h4>
          <Video
            src='https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'
            width={300}
            height={169}
          />
        </div>
        <div>
          <h4 style={{ marginBottom: '8px', color: '#666' }}>비디오 2 (전체화면 비활성화)</h4>
          <Video
            src='https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4'
            width={300}
            height={169}
            fullscreenable={false}
          />
        </div>
        <div>
          <h4 style={{ marginBottom: '8px', color: '#666' }}>비디오 3 (자동 재생)</h4>
          <Video
            src='https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4'
            width={300}
            height={169}
            autoPlay
            muted
          />
        </div>
      </div>
    </div>
  )
}

export const ResponsiveVideo: Story = {
  render: () => (
    <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
      <h3 style={{ marginBottom: '16px', color: '#333' }}>반응형 비디오</h3>
      <div style={{ maxWidth: '100%', width: '100%' }}>
        <Video
          src='https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'
          width={100}
          height={56}
        />
      </div>
    </div>
  )
}
