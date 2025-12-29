import type { Meta, StoryObj } from '@storybook/react-vite'
import { Tooltip } from './index'
import { Button } from '../Button'

const meta: Meta<typeof Tooltip> = {
  title: 'Components/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '툴팁 컴포넌트입니다. 마우스 호버 시 추가 정보를 표시합니다.'
      }
    }
  },
  argTypes: {
    text: {
      control: { type: 'text' },
      description: '툴팁 텍스트'
    },
    position: {
      control: { type: 'select' },
      options: ['top', 'bottom', 'left', 'right'],
      description: '툴팁 위치'
    },
    type: {
      control: { type: 'select' },
      options: ['primary', 'success', 'error', 'warning', 'secondary'],
      description: '툴팁 타입'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
      <h3 style={{ marginBottom: '16px', color: '#333' }}>기본 툴팁</h3>
      <Tooltip text='기본 툴팁입니다'>
        <Button>마우스를 올려보세요</Button>
      </Tooltip>
    </div>
  )
}

export const AllPositions: Story = {
  render: () => (
    <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
      <h3 style={{ marginBottom: '16px', color: '#333' }}>툴팁 위치 (동서남북)</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
        {/* 북쪽 (위쪽) */}
        <Tooltip text='북쪽 툴팁 (위쪽)' position='top'>
          <Button>북쪽 (위쪽)</Button>
        </Tooltip>

        {/* 동서남북 중앙 배치 */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          {/* 서쪽 (왼쪽) */}
          <Tooltip text='서쪽 툴팁 (왼쪽)' position='left'>
            <Button>서쪽 (왼쪽)</Button>
          </Tooltip>

          {/* 중앙 공간 */}
          <div
            style={{
              width: '100px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666'
            }}
          >
            중앙
          </div>

          {/* 동쪽 (오른쪽) */}
          <Tooltip text='동쪽 툴팁 (오른쪽)' position='right'>
            <Button>동쪽 (오른쪽)</Button>
          </Tooltip>
        </div>

        {/* 남쪽 (아래쪽) */}
        <Tooltip text='남쪽 툴팁 (아래쪽)' position='bottom'>
          <Button>남쪽 (아래쪽)</Button>
        </Tooltip>
      </div>
    </div>
  )
}

export const DirectionalExample: Story = {
  render: () => (
    <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
      <h3 style={{ marginBottom: '16px', color: '#333' }}>방향별 툴팁 예제</h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px',
          alignItems: 'center',
          justifyItems: 'center'
        }}
      >
        {/* 첫 번째 행: 위쪽 */}
        <div></div>
        <Tooltip text='위쪽 툴팁입니다' position='top'>
          <Button>위쪽</Button>
        </Tooltip>
        <div></div>

        {/* 두 번째 행: 왼쪽, 중앙, 오른쪽 */}
        <Tooltip text='왼쪽 툴팁입니다' position='left'>
          <Button>왼쪽</Button>
        </Tooltip>

        <div
          style={{
            width: '80px',
            height: '40px',
            backgroundColor: '#f0f0f0',
            border: '1px solid #ddd',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            color: '#666'
          }}
        >
          호버 영역
        </div>

        <Tooltip text='오른쪽 툴팁입니다' position='right'>
          <Button>오른쪽</Button>
        </Tooltip>

        {/* 세 번째 행: 아래쪽 */}
        <div></div>
        <Tooltip text='아래쪽 툴팁입니다' position='bottom'>
          <Button>아래쪽</Button>
        </Tooltip>
        <div></div>
      </div>
    </div>
  )
}

export const AllTypes: Story = {
  render: () => (
    <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
      <h3 style={{ marginBottom: '16px', color: '#333' }}>툴팁 타입</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
        <Tooltip text='기본 툴팁' type='primary'>
          <Button>기본</Button>
        </Tooltip>

        <Tooltip text='성공 툴팁' type='success'>
          <Button>성공</Button>
        </Tooltip>

        <Tooltip text='오류 툴팁' type='error'>
          <Button>오류</Button>
        </Tooltip>

        <Tooltip text='경고 툴팁' type='warning'>
          <Button>경고</Button>
        </Tooltip>

        <Tooltip text='보조 툴팁' type='secondary'>
          <Button>보조</Button>
        </Tooltip>
      </div>
    </div>
  )
}

export const LongText: Story = {
  render: () => (
    <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
      <h3 style={{ marginBottom: '16px', color: '#333' }}>긴 텍스트 툴팁</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
        <Tooltip text='이것은 툴팁 컴포넌트가 긴 내용을 어떻게 처리하는지 보여주는 매우 긴 툴팁 텍스트입니다. 적절히 줄바꿈되어 가독성을 유지해야 합니다.'>
          <Button>긴 툴팁</Button>
        </Tooltip>

        <Tooltip text='이것은 최대 너비 처리를 테스트하기 위해 계속 이어지는 극도로 긴 툴팁 텍스트입니다. 툴팁은 내용을 수용하기 위해 확장되어야 하며 적절한 가독성과 시각적 매력을 유지해야 합니다.'>
          <Button>매우 긴 툴팁</Button>
        </Tooltip>
      </div>
    </div>
  )
}

export const DifferentSizes: Story = {
  render: () => (
    <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
      <h3 style={{ marginBottom: '16px', color: '#333' }}>다양한 크기의 컴포넌트</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
        <Tooltip text='작은 버튼 툴팁'>
          <Button size='small'>작은 버튼</Button>
        </Tooltip>

        <Tooltip text='중간 버튼 툴팁'>
          <Button>중간 버튼</Button>
        </Tooltip>

        <Tooltip text='큰 버튼 툴팁'>
          <Button size='large'>큰 버튼</Button>
        </Tooltip>

        <Tooltip text='넓은 요소 툴팁'>
          <div
            style={{
              width: '200px',
              height: '40px',
              backgroundColor: '#0070f3',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            넓은 요소
          </div>
        </Tooltip>

        <Tooltip text='높은 요소 툴팁'>
          <div
            style={{
              width: '80px',
              height: '100px',
              backgroundColor: '#28a745',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            높은 요소
          </div>
        </Tooltip>
      </div>
    </div>
  )
}

export const WithHTML: Story = {
  render: () => (
    <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
      <h3 style={{ marginBottom: '16px', color: '#333' }}>HTML 내용이 있는 툴팁</h3>
      <Tooltip
        text={
          <div>
            <strong>굵은 텍스트</strong>
            <br />
            <em>기울임 텍스트</em>
            <br />
            <span style={{ color: '#0070f3' }}>색상이 있는 텍스트</span>
          </div>
        }
      >
        <Button>HTML 툴팁</Button>
      </Tooltip>
    </div>
  )
}

export const Interactive: Story = {
  render: () => (
    <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
      <h3 style={{ marginBottom: '16px', color: '#333' }}>상호작용 요소</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
        <Tooltip text='이 버튼을 클릭하여 작업을 수행하세요'>
          <Button onClick={() => alert('버튼이 클릭되었습니다!')}>클릭 가능한 버튼</Button>
        </Tooltip>

        <Tooltip text='툴팁이 있는 텍스트 요소입니다'>
          <div style={{ cursor: 'pointer', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}>
            호버 가능한 텍스트
          </div>
        </Tooltip>

        <Tooltip text='사용자 정의 스타일 요소입니다'>
          <div
            style={{
              cursor: 'pointer',
              padding: '8px 16px',
              backgroundColor: '#0070f3',
              color: 'white',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            사용자 정의 요소
          </div>
        </Tooltip>
      </div>
    </div>
  )
}

export const MultipleTooltips: Story = {
  render: () => (
    <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
      <h3 style={{ marginBottom: '16px', color: '#333' }}>여러 툴팁</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
        <Tooltip text='첫 번째 툴팁' position='top'>
          <Button>첫 번째</Button>
        </Tooltip>

        <Tooltip text='두 번째 툴팁' position='bottom'>
          <Button>두 번째</Button>
        </Tooltip>

        <Tooltip text='세 번째 툴팁' position='left'>
          <Button>세 번째</Button>
        </Tooltip>

        <Tooltip text='네 번째 툴팁' position='right'>
          <Button>네 번째</Button>
        </Tooltip>
      </div>
    </div>
  )
}
