import styled from '@emotion/styled'
import { VFC } from 'react'

import { Input } from '.'
import { InputProps } from './type'
import { useInput } from './useInput'

export const SearchInput: VFC<Partial<Omit<InputProps, 'prefix' | 'suffix' | 'prefixStyling' | 'suffixStyling'>>> = (
  props
) => {
  const { size = 'medium', disabled = false, placeholder, value, onChange } = useInput(props)

  return (
    <Input
      size={size}
      disabled={disabled}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      prefix={
        <svg
          viewBox='0 0 24 24'
          width='18'
          height='18'
          stroke='currentColor'
          strokeWidth='1.5'
          strokeLinecap='round'
          strokeLinejoin='round'
          fill='none'
          shapeRendering='geometricPrecision'
        >
          <path d='M11 17.25a6.25 6.25 0 110-12.5 6.25 6.25 0 010 12.5z' />
          <path d='M16 16l4.5 4.5' />
        </svg>
      }
      suffix={
        value.length > 0 && (
          <RemoveText onClick={() => onChange('')}>
            <svg
              viewBox='0 0 24 24'
              width='18'
              height='18'
              stroke='currentColor'
              strokeWidth='1.5'
              strokeLinecap='round'
              strokeLinejoin='round'
              fill='none'
              shapeRendering='geometricPrecision'
            >
              <path d='M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z' />
              <path d='M18 9l-6 6' />
              <path d='M12 9l6 6' />
            </svg>
          </RemoveText>
        )
      }
      prefixStyling={false}
      suffixStyling={false}
    />
  )
}

const RemoveText = styled.div`
  cursor: pointer;
`
