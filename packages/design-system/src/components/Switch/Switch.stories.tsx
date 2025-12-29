import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Switch } from './Switch'

const meta: Meta<typeof Switch> = {
  title: 'Components/Switch',
  component: Switch,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '스위치 컴포넌트입니다. 켜기/끄기 상태를 토글할 수 있습니다.'
      }
    }
  },
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['small', 'medium', 'large'],
      description: '스위치 크기'
    },
    disabled: {
      control: { type: 'boolean' },
      description: '비활성화 상태'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => {
    const [active, setActive] = useState(false)
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
        <Switch active={active} onChange={setActive} label='기본 스위치' />
        <div>상태: {active ? '켜짐' : '꺼짐'}</div>
      </div>
    )
  }
}

export const AllSizes: Story = {
  render: () => {
    const [active1, setActive1] = useState(false)
    const [active2, setActive2] = useState(true)
    const [active3, setActive3] = useState(false)

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          <Switch active={active1} onChange={setActive1} label='작은 스위치' size='small' />
          <div>상태: {active1 ? '켜짐' : '꺼짐'}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          <Switch active={active2} onChange={setActive2} label='중간 스위치' size='medium' />
          <div>상태: {active2 ? '켜짐' : '꺼짐'}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          <Switch active={active3} onChange={setActive3} label='큰 스위치' size='large' />
          <div>상태: {active3 ? '켜짐' : '꺼짐'}</div>
        </div>
      </div>
    )
  }
}

export const WithLabels: Story = {
  render: () => {
    const [active1, setActive1] = useState(false)
    const [active2, setActive2] = useState(true)
    const [active3, setActive3] = useState(false)
    const [active4, setActive4] = useState(true)

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
        <Switch active={active1} onChange={setActive1} label='알림 설정' />
        <Switch active={active2} onChange={setActive2} label='다크 모드' />
        <Switch active={active3} onChange={setActive3} label='자동 저장' />
        <Switch active={active4} onChange={setActive4} label='개인정보 수집 동의' />
      </div>
    )
  }
}

export const Disabled: Story = {
  render: () => {
    const [active1, setActive1] = useState(false)
    const [active2, setActive2] = useState(true)

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
        <Switch active={active1} onChange={setActive1} label='비활성화된 스위치 (꺼짐)' disabled />
        <Switch active={active2} onChange={setActive2} label='비활성화된 스위치 (켜짐)' disabled />
      </div>
    )
  }
}

export const Interactive: Story = {
  render: () => {
    const [switches, setSwitches] = useState({
      notifications: false,
      darkMode: true,
      autoSave: false,
      analytics: true,
      marketing: false
    })

    const handleToggle = (key: keyof typeof switches) => {
      setSwitches((prev) => ({
        ...prev,
        [key]: !prev[key]
      }))
    }

    const handleReset = () => {
      setSwitches({
        notifications: false,
        darkMode: false,
        autoSave: false,
        analytics: false,
        marketing: false
      })
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
        <h3>설정</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
          <Switch active={switches.notifications} onChange={() => handleToggle('notifications')} label='푸시 알림' />
          <Switch active={switches.darkMode} onChange={() => handleToggle('darkMode')} label='다크 모드' />
          <Switch active={switches.autoSave} onChange={() => handleToggle('autoSave')} label='자동 저장' />
          <Switch active={switches.analytics} onChange={() => handleToggle('analytics')} label='분석 데이터 수집' />
          <Switch active={switches.marketing} onChange={() => handleToggle('marketing')} label='마케팅 이메일' />
        </div>

        <button
          onClick={handleReset}
          style={{
            padding: '8px 16px',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          모든 설정 초기화
        </button>

        <div style={{ fontSize: '12px', color: '#666', textAlign: 'center' }}>
          활성화된 설정: {Object.values(switches).filter(Boolean).length}개
        </div>
      </div>
    )
  }
}

export const DifferentStates: Story = {
  render: () => {
    const [states, setStates] = useState({
      small: false,
      medium: true,
      large: false,
      disabled: true
    })

    const handleToggle = (key: keyof typeof states) => {
      if (key !== 'disabled') {
        setStates((prev) => ({
          ...prev,
          [key]: !prev[key]
        }))
      }
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          <Switch active={states.small} onChange={() => handleToggle('small')} label='작은 크기' size='small' />
          <div>상태: {states.small ? '켜짐' : '꺼짐'}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          <Switch active={states.medium} onChange={() => handleToggle('medium')} label='중간 크기' size='medium' />
          <div>상태: {states.medium ? '켜짐' : '꺼짐'}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          <Switch active={states.large} onChange={() => handleToggle('large')} label='큰 크기' size='large' />
          <div>상태: {states.large ? '켜짐' : '꺼짐'}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          <Switch active={states.disabled} onChange={() => handleToggle('disabled')} label='비활성화' disabled />
          <div>상태: {states.disabled ? '켜짐' : '꺼짐'} (변경 불가)</div>
        </div>
      </div>
    )
  }
}
