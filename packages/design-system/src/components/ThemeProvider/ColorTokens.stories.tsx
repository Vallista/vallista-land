import type { Meta, StoryObj } from '@storybook/react-vite'
import { useTheme } from './index'

const meta: Meta = {
  title: 'Core/ColorTokens',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '디자인 시스템의 색상 토큰을 시각적으로 표시합니다. Vercel 디자인시스템을 참고하여 구성되었습니다.'
      }
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

const ColorTokensDemo = () => {
  const { currentTheme, changeTheme } = useTheme()

  const colorTokens = {
    'Primary Colors': {
      Background: 'var(--primary-background)',
      Foreground: 'var(--primary-foreground)',
      'Accent 1': 'var(--primary-accent-1)',
      'Accent 2': 'var(--primary-accent-2)',
      'Accent 3': 'var(--primary-accent-3)',
      'Accent 4': 'var(--primary-accent-4)',
      'Accent 5': 'var(--primary-accent-5)'
    },
    'Semantic Colors': {
      Success: 'var(--success-default)',
      'Success Foreground': 'var(--success-foreground)',
      Error: 'var(--error-default)',
      'Error Foreground': 'var(--error-foreground)',
      Warning: 'var(--warning-default)',
      'Warning Foreground': 'var(--warning-foreground)'
    }
  }

  return (
    <div
      style={{
        padding: '32px',
        border: '1px solid var(--primary-accent-3)',
        borderRadius: '12px',
        backgroundColor: 'var(--primary-background)',
        color: 'var(--primary-foreground)',
        maxWidth: '800px',
        width: '100%'
      }}
    >
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <h2
          style={{
            margin: '0 0 8px 0',
            fontSize: '24px',
            fontWeight: '600',
            color: 'var(--primary-foreground)'
          }}
        >
          Color Tokens
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: '14px',
            color: 'var(--primary-accent-5)',
            fontFamily: 'monospace'
          }}
        >
          {currentTheme} Theme
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
        {Object.entries(colorTokens).map(([category, colors]) => (
          <div key={category}>
            <h3
              style={{
                marginBottom: '16px',
                fontSize: '16px',
                fontWeight: '600',
                color: 'var(--primary-foreground)',
                borderBottom: '1px solid var(--primary-accent-2)',
                paddingBottom: '8px'
              }}
            >
              {category}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(colors).map(([name, value]) => (
                <div
                  key={name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    backgroundColor: 'var(--primary-accent-1)',
                    borderRadius: '8px',
                    border: '1px solid var(--primary-accent-2)'
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      backgroundColor: value,
                      borderRadius: '6px',
                      border: '1px solid var(--primary-accent-3)',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: 'var(--primary-foreground)',
                        marginBottom: '2px'
                      }}
                    >
                      {name}
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        color: 'var(--primary-accent-5)'
                      }}
                    >
                      {value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginTop: '32px',
          justifyContent: 'center',
          paddingTop: '24px',
          borderTop: '1px solid var(--primary-accent-2)'
        }}
      >
        <button
          onClick={() => changeTheme('LIGHT')}
          disabled={currentTheme === 'LIGHT'}
          style={{
            padding: '12px 24px',
            backgroundColor: currentTheme === 'LIGHT' ? 'var(--primary-accent-2)' : 'var(--primary-accent-1)',
            color: 'var(--primary-foreground)',
            border: '1px solid var(--primary-accent-3)',
            borderRadius: '8px',
            cursor: currentTheme === 'LIGHT' ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            opacity: currentTheme === 'LIGHT' ? 0.6 : 1
          }}
        >
          Light Theme
        </button>
        <button
          onClick={() => changeTheme('DARK')}
          disabled={currentTheme === 'DARK'}
          style={{
            padding: '12px 24px',
            backgroundColor: currentTheme === 'DARK' ? 'var(--primary-accent-2)' : 'var(--primary-accent-1)',
            color: 'var(--primary-foreground)',
            border: '1px solid var(--primary-accent-3)',
            borderRadius: '8px',
            cursor: currentTheme === 'DARK' ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            opacity: currentTheme === 'DARK' ? 0.6 : 1
          }}
        >
          Dark Theme
        </button>
      </div>
    </div>
  )
}

export const Default: Story = {
  render: () => <ColorTokensDemo />
}
