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
      prefixStyling={false}
      suffixStyling={false}
    />
  )
}
