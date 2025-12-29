import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Radio, RadioGroup } from './index'

const meta: Meta<typeof Radio> = {
  title: 'Components/Radio',
  component: Radio,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '라디오 버튼 컴포넌트입니다. RadioGroup과 함께 사용해야 합니다.'
      }
    }
  },
  argTypes: {
    value: {
      control: { type: 'text' },
      description: '라디오 버튼의 값'
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
    const [value, setValue] = useState('option1')

    return (
      <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
        <h3 style={{ marginBottom: '16px', color: '#333' }}>Radio Group Example</h3>
        <RadioGroup value={value} onChange={setValue} disabled={false} label='Options'>
          <Radio value='option1'>Option 1</Radio>
          <Radio value='option2'>Option 2</Radio>
          <Radio value='option3'>Option 3</Radio>
        </RadioGroup>
      </div>
    )
  }
}

export const WithDisabled: Story = {
  render: () => {
    const [value, setValue] = useState('option1')

    return (
      <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
        <h3 style={{ marginBottom: '16px', color: '#333' }}>Radio Group with Disabled Option</h3>
        <RadioGroup value={value} onChange={setValue} disabled={false} label='Options'>
          <Radio value='option1'>Option 1</Radio>
          <Radio value='option2' disabled>
            Option 2 (Disabled)
          </Radio>
          <Radio value='option3'>Option 3</Radio>
        </RadioGroup>
      </div>
    )
  }
}

export const AllDisabled: Story = {
  render: () => {
    const [value, setValue] = useState('option1')

    return (
      <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
        <h3 style={{ marginBottom: '16px', color: '#333' }}>Radio Group - All Disabled</h3>
        <RadioGroup value={value} onChange={setValue} disabled={true} label='Options'>
          <Radio value='option1'>Option 1</Radio>
          <Radio value='option2'>Option 2</Radio>
          <Radio value='option3'>Option 3</Radio>
        </RadioGroup>
      </div>
    )
  }
}

export const MultipleGroups: Story = {
  render: () => {
    const [group1Value, setGroup1Value] = useState('a')
    const [group2Value, setGroup2Value] = useState('x')

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
          <h3 style={{ marginBottom: '16px', color: '#333' }}>Group 1</h3>
          <RadioGroup value={group1Value} onChange={setGroup1Value} disabled={false} label='Group 1'>
            <Radio value='a'>Option A</Radio>
            <Radio value='b'>Option B</Radio>
            <Radio value='c'>Option C</Radio>
          </RadioGroup>
        </div>

        <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
          <h3 style={{ marginBottom: '16px', color: '#333' }}>Group 2</h3>
          <RadioGroup value={group2Value} onChange={setGroup2Value} disabled={false} label='Group 2'>
            <Radio value='x'>Option X</Radio>
            <Radio value='y'>Option Y</Radio>
            <Radio value='z'>Option Z</Radio>
          </RadioGroup>
        </div>
      </div>
    )
  }
}

export const Interactive: Story = {
  render: () => {
    const [value, setValue] = useState('option1')

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
          <h3 style={{ marginBottom: '16px', color: '#333' }}>Interactive Radio Group</h3>
          <RadioGroup value={value} onChange={setValue} disabled={false} label='Select an option'>
            <Radio value='option1'>Option 1</Radio>
            <Radio value='option2'>Option 2</Radio>
            <Radio value='option3'>Option 3</Radio>
          </RadioGroup>
        </div>

        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
          <strong>Selected value:</strong> {value}
        </div>
      </div>
    )
  }
}
