import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { ThemeProvider, useTheme } from './index'
import { Button } from '../Button'

const meta: Meta<typeof ThemeProvider> = {
  title: 'Components/ThemeProvider',
  component: ThemeProvider,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '테마를 관리하는 Provider 컴포넌트입니다. 라이트/다크 모드를 지원하며 시스템 테마를 자동으로 감지합니다.'
      }
    }
  },
  argTypes: {
    theme: {
      control: { type: 'select' },
      options: ['LIGHT', 'DARK'],
      description: '초기 테마'
    },
    enableSystemTheme: {
      control: { type: 'boolean' },
      description: '시스템 테마 자동 감지 활성화'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

// 테마 데모 컴포넌트
const ThemeDemo = () => {
  const { changeTheme, currentTheme } = useTheme()

  return (
    <div
      style={{
        padding: '20px',
        border: '1px solid var(--primary-accent-3)',
        borderRadius: '8px',
        backgroundColor: 'var(--primary-background)'
      }}
    >
      <h3 style={{ marginBottom: '16px', color: 'var(--primary-foreground)' }}>테마 데모 - 현재: {currentTheme}</h3>
      <div style={{ display: 'flex', gap: '8px' }}>
        <Button onClick={() => changeTheme('LIGHT')} disabled={currentTheme === 'LIGHT'}>
          라이트 테마
        </Button>
        <Button onClick={() => changeTheme('DARK')} disabled={currentTheme === 'DARK'}>
          다크 테마
        </Button>
      </div>
      <div
        style={{ marginTop: '16px', padding: '12px', backgroundColor: 'var(--primary-accent-1)', borderRadius: '4px' }}
      >
        <p style={{ color: 'var(--primary-foreground)', fontSize: '14px', margin: 0 }}>
          <strong>참고:</strong> 테마 설정은 localStorage에 저장되어 세션 간에 유지됩니다.
        </p>
      </div>
    </div>
  )
}

export const Default: Story = {
  render: () => <ThemeDemo />
}

export const InitialDarkTheme: Story = {
  render: () => <ThemeDemo />
}

export const DisableSystemTheme: Story = {
  render: () => <ThemeDemo />
}

export const ThemeColors: Story = {
  render: () => {
    const ColorDemo = () => {
      const { changeTheme, currentTheme } = useTheme()

      return (
        <div
          style={{
            padding: '20px',
            border: '1px solid var(--primary-accent-3)',
            borderRadius: '8px',
            backgroundColor: 'var(--primary-background)'
          }}
        >
          <h3 style={{ marginBottom: '16px', color: 'var(--primary-foreground)' }}>테마 색상 데모 - {currentTheme}</h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '12px', backgroundColor: 'var(--primary-accent-1)', borderRadius: '4px' }}>
              <p style={{ color: 'var(--primary-foreground)', fontSize: '12px', margin: 0 }}>기본 강조 1</p>
            </div>
            <div style={{ padding: '12px', backgroundColor: 'var(--primary-accent-2)', borderRadius: '4px' }}>
              <p style={{ color: 'var(--primary-foreground)', fontSize: '12px', margin: 0 }}>기본 강조 2</p>
            </div>
            <div style={{ padding: '12px', backgroundColor: 'var(--primary-accent-3)', borderRadius: '4px' }}>
              <p style={{ color: 'var(--primary-foreground)', fontSize: '12px', margin: 0 }}>기본 강조 3</p>
            </div>
            <div style={{ padding: '12px', backgroundColor: 'var(--success-default)', borderRadius: '4px' }}>
              <p style={{ color: 'white', fontSize: '12px', margin: 0 }}>성공 기본</p>
            </div>
            <div style={{ padding: '12px', backgroundColor: 'var(--error-default)', borderRadius: '4px' }}>
              <p style={{ color: 'white', fontSize: '12px', margin: 0 }}>오류 기본</p>
            </div>
            <div style={{ padding: '12px', backgroundColor: 'var(--warning-default)', borderRadius: '4px' }}>
              <p style={{ color: 'white', fontSize: '12px', margin: 0 }}>경고 기본</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <Button onClick={() => changeTheme('LIGHT')} disabled={currentTheme === 'LIGHT'}>
              라이트 테마
            </Button>
            <Button onClick={() => changeTheme('DARK')} disabled={currentTheme === 'DARK'}>
              다크 테마
            </Button>
          </div>
        </div>
      )
    }

    return <ColorDemo />
  }
}

export const Interactive: Story = {
  render: () => {
    const InteractiveDemo = () => {
      const { changeTheme, currentTheme } = useTheme()
      const [themeHistory, setThemeHistory] = useState<string[]>([])

      const handleThemeChange = (theme: 'LIGHT' | 'DARK') => {
        changeTheme(theme)
        setThemeHistory((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${theme}`])
      }

      return (
        <div
          style={{
            padding: '20px',
            border: '1px solid var(--primary-accent-3)',
            borderRadius: '8px',
            backgroundColor: 'var(--primary-background)'
          }}
        >
          <h3 style={{ marginBottom: '16px', color: 'var(--primary-foreground)' }}>상호작용 테마 데모</h3>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <Button onClick={() => handleThemeChange('LIGHT')} disabled={currentTheme === 'LIGHT'}>
              라이트로 전환
            </Button>
            <Button onClick={() => handleThemeChange('DARK')} disabled={currentTheme === 'DARK'}>
              다크로 전환
            </Button>
          </div>

          <div
            style={{
              padding: '12px',
              backgroundColor: 'var(--primary-accent-1)',
              borderRadius: '4px',
              maxHeight: '200px',
              overflowY: 'auto'
            }}
          >
            <p
              style={{ color: 'var(--primary-foreground)', fontSize: '14px', marginBottom: '8px', margin: '0 0 8px 0' }}
            >
              <strong>테마 변경 기록:</strong>
            </p>
            {themeHistory.length === 0 ? (
              <p style={{ color: 'var(--primary-accent-5)', fontSize: '12px', margin: 0 }}>아직 테마 변경이 없습니다</p>
            ) : (
              themeHistory.map((entry, index) => (
                <p
                  key={index}
                  style={{ color: 'var(--primary-foreground)', fontSize: '12px', display: 'block', margin: '4px 0' }}
                >
                  {entry}
                </p>
              ))
            )}
          </div>
        </div>
      )
    }

    return <InteractiveDemo />
  }
}
