import type { Meta, StoryObj } from '@storybook/react-vite'
import { ToastProvider, useToastContext } from './index'
import { ThemeProvider } from '../ThemeProvider'

const meta: Meta<typeof ToastProvider> = {
  title: 'Components/Toast',
  component: ToastProvider,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '토스트 알림 컴포넌트입니다. 버튼을 클릭하면 화면 최하단 중앙에 토스트 메시지가 나타납니다. ThemeProvider에 포함되어 있어 별도로 사용하지 않고, useToastContext를 통해 사용합니다.'
      }
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

// Toast 데모 컴포넌트
const ToastDemo = () => {
  const { message, success, error } = useToastContext()

  return (
    <div
      style={{
        padding: '20px',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        backgroundColor: '#fafafa',
        maxWidth: '400px'
      }}
    >
      <h3 style={{ marginBottom: '16px', color: '#333' }}>토스트 데모</h3>
      <p style={{ marginBottom: '16px', fontSize: '14px', color: '#666' }}>
        아래 버튼들을 클릭하면 <strong>화면 최하단 중앙</strong>에 토스트 메시지가 나타납니다.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button
          onClick={() => message('기본 토스트 메시지입니다')}
          style={{
            padding: '12px 16px',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          기본 토스트 표시
        </button>
        <button
          onClick={() => success('작업이 성공적으로 완료되었습니다!')}
          style={{
            padding: '12px 16px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          성공 토스트 표시
        </button>
        <button
          onClick={() => error('처리 중 오류가 발생했습니다')}
          style={{
            padding: '12px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          오류 토스트 표시
        </button>
      </div>
      <div
        style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#e8f4fd',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#0066cc'
        }}
      >
        💡 <strong>팁:</strong> 토스트는 화면 하단 중앙에 나타나며, 5초 후 자동으로 사라집니다.
      </div>
    </div>
  )
}

export const Default: Story = {
  render: () => (
    <ThemeProvider>
      <ToastDemo />
    </ThemeProvider>
  )
}

export const MultipleToasts: Story = {
  render: () => {
    const MultipleToastDemo = () => {
      const { message, success, error } = useToastContext()

      const showMultiple = () => {
        message('첫 번째 토스트 메시지')
        setTimeout(() => success('두 번째 성공 메시지'), 500)
        setTimeout(() => error('세 번째 오류 메시지'), 1000)
        setTimeout(() => message('네 번째 기본 메시지'), 1500)
      }

      return (
        <div
          style={{
            padding: '20px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            backgroundColor: '#fafafa',
            maxWidth: '400px'
          }}
        >
          <h3 style={{ marginBottom: '16px', color: '#333' }}>여러 토스트 데모</h3>
          <p style={{ marginBottom: '16px', fontSize: '14px', color: '#666' }}>
            여러 토스트가 <strong>화면 하단 중앙</strong>에 쌓이는 것을 확인하세요.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={showMultiple}
              style={{
                padding: '12px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              여러 토스트 표시
            </button>
            <div style={{ fontSize: '14px', color: '#666' }}>
              <strong>동작:</strong> 버튼을 클릭하면 4개의 토스트가 순차적으로 나타납니다
            </div>
          </div>
        </div>
      )
    }

    return (
      <ThemeProvider>
        <MultipleToastDemo />
      </ThemeProvider>
    )
  }
}

export const LongMessage: Story = {
  render: () => {
    const LongMessageDemo = () => {
      const { message } = useToastContext()

      const showLongMessage = () => {
        message(
          '이것은 토스트 컴포넌트가 긴 텍스트 내용을 어떻게 처리하는지 보여주는 매우 긴 토스트 메시지입니다. 적절히 줄바꿈되어 가독성을 유지해야 합니다.'
        )
      }

      return (
        <div
          style={{
            padding: '20px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            backgroundColor: '#fafafa',
            maxWidth: '400px'
          }}
        >
          <h3 style={{ marginBottom: '16px', color: '#333' }}>긴 메시지 데모</h3>
          <p style={{ marginBottom: '16px', fontSize: '14px', color: '#666' }}>
            긴 메시지가 <strong>화면 하단 중앙</strong>에서 어떻게 표시되는지 확인하세요.
          </p>
          <button
            onClick={showLongMessage}
            style={{
              padding: '12px 16px',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            긴 메시지 토스트 표시
          </button>
        </div>
      )
    }

    return (
      <ThemeProvider>
        <LongMessageDemo />
      </ThemeProvider>
    )
  }
}

export const Interactive: Story = {
  render: () => {
    const InteractiveDemo = () => {
      const { message, success, error } = useToastContext()

      const handleFormSubmit = () => {
        // 폼 제출 시뮬레이션
        message('요청을 처리하고 있습니다...')

        setTimeout(() => {
          success('폼이 성공적으로 제출되었습니다!')
        }, 1000)
      }

      const handleErrorAction = () => {
        // 오류 시뮬레이션
        message('데이터를 저장하려고 시도하고 있습니다...')

        setTimeout(() => {
          error('데이터 저장에 실패했습니다. 다시 시도해주세요.')
        }, 1000)
      }

      return (
        <div
          style={{
            padding: '20px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            backgroundColor: '#fafafa',
            maxWidth: '400px'
          }}
        >
          <h3 style={{ marginBottom: '16px', color: '#333' }}>상호작용 데모</h3>
          <p style={{ marginBottom: '16px', fontSize: '14px', color: '#666' }}>
            실제 사용 시나리오를 시뮬레이션합니다. <strong>화면 하단 중앙</strong>에 토스트가 나타납니다.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={handleFormSubmit}
              style={{
                padding: '12px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              폼 제출 시뮬레이션
            </button>
            <button
              onClick={handleErrorAction}
              style={{
                padding: '12px 16px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              오류 시뮬레이션
            </button>
            <div style={{ fontSize: '14px', color: '#666' }}>
              <strong>동작:</strong> 버튼 클릭 시 진행 상태 → 결과 토스트가 순차적으로 표시됩니다
            </div>
          </div>
        </div>
      )
    }

    return (
      <ThemeProvider>
        <InteractiveDemo />
      </ThemeProvider>
    )
  }
}
