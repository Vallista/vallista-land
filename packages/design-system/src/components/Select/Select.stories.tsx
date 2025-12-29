import type { Meta, StoryObj } from '@storybook/react-vite'
import { Select } from './index'

const meta: Meta<typeof Select> = {
  title: 'Components/Select',
  component: Select,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '선택 컴포넌트입니다. 드롭다운 형태로 옵션을 선택할 수 있습니다.'
      }
    }
  },
  argTypes: {
    value: {
      control: { type: 'text' },
      description: '선택된 값'
    },
    disabled: {
      control: { type: 'boolean' },
      description: '비활성화 상태'
    },
    placeholder: {
      control: { type: 'text' },
      description: '플레이스홀더 텍스트'
    },
    width: {
      control: { type: 'text' },
      description: '컴포넌트 너비'
    },
    maxWidth: {
      control: { type: 'text' },
      description: '최대 너비'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
      <h3 style={{ marginBottom: '16px', color: '#333' }}>기본 선택</h3>
      <Select placeholder='옵션을 선택하세요' width='200px'>
        <option value='option1'>옵션 1</option>
        <option value='option2'>옵션 2</option>
        <option value='option3'>옵션 3</option>
      </Select>
    </div>
  )
}

export const WithValue: Story = {
  render: () => (
    <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
      <h3 style={{ marginBottom: '16px', color: '#333' }}>값이 있는 선택</h3>
      <Select value='option2' width='200px'>
        <option value='option1'>옵션 1</option>
        <option value='option2'>옵션 2</option>
        <option value='option3'>옵션 3</option>
      </Select>
    </div>
  )
}

export const Disabled: Story = {
  render: () => (
    <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
      <h3 style={{ marginBottom: '16px', color: '#333' }}>비활성화된 선택</h3>
      <Select disabled placeholder='비활성화됨' width='200px'>
        <option value='option1'>옵션 1</option>
        <option value='option2'>옵션 2</option>
        <option value='option3'>옵션 3</option>
      </Select>
    </div>
  )
}

export const CustomWidth: Story = {
  render: () => (
    <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
      <h3 style={{ marginBottom: '16px', color: '#333' }}>커스텀 너비</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Select placeholder='좁은 너비' width='120px'>
          <option value='option1'>옵션 1</option>
          <option value='option2'>옵션 2</option>
        </Select>
        <Select placeholder='보통 너비' width='200px'>
          <option value='option1'>옵션 1</option>
          <option value='option2'>옵션 2</option>
        </Select>
        <Select placeholder='넓은 너비' width='300px'>
          <option value='option1'>옵션 1</option>
          <option value='option2'>옵션 2</option>
        </Select>
      </div>
    </div>
  )
}

export const ManyOptions: Story = {
  render: () => (
    <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
      <h3 style={{ marginBottom: '16px', color: '#333' }}>많은 옵션</h3>
      <Select placeholder='국가를 선택하세요' width='250px'>
        <option value='kr'>대한민국</option>
        <option value='us'>미국</option>
        <option value='jp'>일본</option>
        <option value='cn'>중국</option>
        <option value='uk'>영국</option>
        <option value='de'>독일</option>
        <option value='fr'>프랑스</option>
        <option value='it'>이탈리아</option>
        <option value='es'>스페인</option>
        <option value='ca'>캐나다</option>
      </Select>
    </div>
  )
}
