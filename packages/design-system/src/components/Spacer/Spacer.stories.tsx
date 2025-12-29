import type { Meta, StoryObj } from '@storybook/react-vite'
import { Spacer } from './index'

const meta: Meta<typeof Spacer> = {
  title: 'Components/Spacer',
  component: Spacer,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '요소 간 간격을 조정하는 컴포넌트입니다. 가로/세로 방향의 여백을 설정할 수 있습니다.'
      }
    }
  },
  argTypes: {
    x: {
      control: { type: 'number' },
      description: '가로 간격 (rem 단위)'
    },
    y: {
      control: { type: 'number' },
      description: '세로 간격 (rem 단위)'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
      <h3 style={{ marginBottom: '16px', color: '#333' }}>스페이서 예시</h3>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <div style={{ backgroundColor: '#0070f3', color: 'white', padding: '8px', borderRadius: '4px' }}>
          첫 번째 요소
        </div>
        <Spacer y={1} />
        <div style={{ backgroundColor: '#28a745', color: 'white', padding: '8px', borderRadius: '4px' }}>
          두 번째 요소
        </div>
        <Spacer y={2} />
        <div style={{ backgroundColor: '#dc3545', color: 'white', padding: '8px', borderRadius: '4px' }}>
          세 번째 요소
        </div>
      </div>
    </div>
  )
}

export const HorizontalSpacing: Story = {
  render: () => (
    <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
      <h3 style={{ marginBottom: '16px', color: '#333' }}>가로 간격</h3>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ backgroundColor: '#0070f3', color: 'white', padding: '8px', borderRadius: '4px' }}>첫 번째</div>
        <Spacer x={1} />
        <div style={{ backgroundColor: '#28a745', color: 'white', padding: '8px', borderRadius: '4px' }}>두 번째</div>
        <Spacer x={2} />
        <div style={{ backgroundColor: '#dc3545', color: 'white', padding: '8px', borderRadius: '4px' }}>세 번째</div>
      </div>
    </div>
  )
}

export const VerticalSpacing: Story = {
  render: () => (
    <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
      <h3 style={{ marginBottom: '16px', color: '#333' }}>세로 간격</h3>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <div style={{ backgroundColor: '#0070f3', color: 'white', padding: '8px', borderRadius: '4px' }}>위쪽 요소</div>
        <Spacer y={1} />
        <div style={{ backgroundColor: '#28a745', color: 'white', padding: '8px', borderRadius: '4px' }}>중간 요소</div>
        <Spacer y={2} />
        <div style={{ backgroundColor: '#dc3545', color: 'white', padding: '8px', borderRadius: '4px' }}>
          아래쪽 요소
        </div>
      </div>
    </div>
  )
}

export const BothDirections: Story = {
  render: () => (
    <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
      <h3 style={{ marginBottom: '16px', color: '#333' }}>가로/세로 간격</h3>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ backgroundColor: '#0070f3', color: 'white', padding: '8px', borderRadius: '4px' }}>요소 1</div>
          <Spacer x={1} />
          <div style={{ backgroundColor: '#28a745', color: 'white', padding: '8px', borderRadius: '4px' }}>요소 2</div>
        </div>
        <Spacer y={1} />
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ backgroundColor: '#dc3545', color: 'white', padding: '8px', borderRadius: '4px' }}>요소 3</div>
          <Spacer x={2} />
          <div style={{ backgroundColor: '#ffc107', color: 'black', padding: '8px', borderRadius: '4px' }}>요소 4</div>
        </div>
      </div>
    </div>
  )
}

export const GridLayout: Story = {
  render: () => (
    <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
      <h3 style={{ marginBottom: '16px', color: '#333' }}>그리드 레이아웃</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        <div
          style={{
            backgroundColor: '#0070f3',
            color: 'white',
            padding: '8px',
            borderRadius: '4px',
            textAlign: 'center'
          }}
        >
          셀 1
        </div>
        <div
          style={{
            backgroundColor: '#28a745',
            color: 'white',
            padding: '8px',
            borderRadius: '4px',
            textAlign: 'center'
          }}
        >
          셀 2
        </div>
        <div
          style={{
            backgroundColor: '#dc3545',
            color: 'white',
            padding: '8px',
            borderRadius: '4px',
            textAlign: 'center'
          }}
        >
          셀 3
        </div>
        <div
          style={{
            backgroundColor: '#ffc107',
            color: 'black',
            padding: '8px',
            borderRadius: '4px',
            textAlign: 'center'
          }}
        >
          셀 4
        </div>
        <div
          style={{
            backgroundColor: '#6f42c1',
            color: 'white',
            padding: '8px',
            borderRadius: '4px',
            textAlign: 'center'
          }}
        >
          셀 5
        </div>
        <div
          style={{
            backgroundColor: '#fd7e14',
            color: 'white',
            padding: '8px',
            borderRadius: '4px',
            textAlign: 'center'
          }}
        >
          셀 6
        </div>
      </div>
    </div>
  )
}

export const DifferentSizes: Story = {
  render: () => (
    <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
      <h3 style={{ marginBottom: '16px', color: '#333' }}>다양한 크기</h3>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <div style={{ backgroundColor: '#0070f3', color: 'white', padding: '8px', borderRadius: '4px' }}>작은 간격</div>
        <Spacer y={0.5} />
        <div style={{ backgroundColor: '#28a745', color: 'white', padding: '8px', borderRadius: '4px' }}>보통 간격</div>
        <Spacer y={1} />
        <div style={{ backgroundColor: '#dc3545', color: 'white', padding: '8px', borderRadius: '4px' }}>큰 간격</div>
        <Spacer y={2} />
        <div style={{ backgroundColor: '#ffc107', color: 'black', padding: '8px', borderRadius: '4px' }}>
          매우 큰 간격
        </div>
      </div>
    </div>
  )
}
