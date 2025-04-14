import styled from '@emotion/styled'

import { Input } from '.'
import { SearchInputProps } from './type'
import { useInput } from './useInput'

/**
 * # SearchInput
 *
 * 검색 인풋 컴포넌트.
 *
 * @param {SearchInputProps} {@link SearchInputProps} 검색 인풋 파라미터
 *
 * @example ```tsx
 * <SearchInput size='small' placeholder='search...' />
 * <SearchInput size='small' placeholder='search...' disabled />
 * ```
 */
export const SearchInput = (
  props: Partial<Omit<SearchInputProps, 'prefix' | 'suffix' | 'prefixStyling' | 'suffixStyling'>>
) => {
  const { size = 'medium', disabled = false, placeholder, value, onChange, onReset } = useInput(props)

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
          <RemoveText onClick={() => (onReset ? onReset() : onChange(''))}>
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
