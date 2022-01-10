import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { forwardRef } from 'react'

import { InputSizeType, InputProps } from './type'
import { useInput } from './useInput'

export const Input = forwardRef<HTMLInputElement, Partial<InputProps>>((props, ref) => {
  const {
    size = 'medium',
    suffixStyling = true,
    prefixStyling = true,
    disabled = false,
    prefix,
    suffix,
    placeholder,
    value,
    onChange
  } = useInput(props)

  return (
    <InputBox
      isPrefix={!!prefix}
      isSuffix={!!suffix}
      suffixStyling={suffixStyling}
      prefixStyling={prefixStyling}
      disabled={disabled}
    >
      <Inner
        ref={ref}
        style={sizeMapper[size]}
        placeholder={placeholder}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
      />
      {prefix && (
        <Prefix styling={prefixStyling} size={size}>
          {prefix}
        </Prefix>
      )}
      {suffix && (
        <Suffix styling={suffixStyling} size={size}>
          {suffix}
        </Suffix>
      )}
    </InputBox>
  )
})

const sizeMapper: Record<InputSizeType, { fontSize?: string; height?: string }> = {
  small: {
    fontSize: '0.875rem',
    height: '32px'
  },
  medium: {},
  large: {
    fontSize: '1rem',
    height: '48px'
  }
}

const InputBox = styled.div<{
  isPrefix: boolean
  isSuffix: boolean
  suffixStyling: boolean
  prefixStyling: boolean
  disabled: boolean
}>`
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  max-width: 100%;

  ${({ theme, isPrefix, isSuffix, prefixStyling, suffixStyling, disabled }) => css`
    ${disabled &&
    css`
      & > input,
      & > span {
        background: ${theme.colors.PRIMARY.ACCENT_1};
        cursor: not-allowed;
      }
    `}

    ${isPrefix &&
    css`
      & > input {
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
      }

      ${!prefixStyling &&
      css`
        & > input {
          border-left: none;
          padding-left: 0;
        }

        & > input:focus + * {
          border-color: ${theme.colors.PRIMARY.ACCENT_5};
        }

        & > input:focus ~ :last-of-type {
          border-color: ${theme.colors.PRIMARY.ACCENT_5};
        }
      `}
    `}

    ${isSuffix &&
    css`
      & > input {
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
      }

      ${!suffixStyling &&
      css`
        & > input {
          border-right: none;
          padding-right: 0;
        }

        & > input:focus + * {
          border-color: ${theme.colors.PRIMARY.ACCENT_5};
        }

        & > input:focus ~ :last-of-type {
          border-color: ${theme.colors.PRIMARY.ACCENT_5};
        }
      `}
    `}
  `}
`

const Inner = styled.input`
  ${({ theme }) => css`
    font: inherit;
    font-size: 100%;
    width: 100%;
    min-width: 0;
    display: inline-flex;
    -webkit-appearance: none;
    border: 1px solid ${theme.colors.PRIMARY.ACCENT_2};
    border-radius: 5px;
    padding: 0 12px;
    background: ${theme.colors.PRIMARY.BACKGROUND};
    color: ${theme.colors.PRIMARY.FOREGROUND};
    height: 40px;
    line-height: normal;
    order: 1;
    outline: none;
    transition: border-color 0.15s ease;

    &:focus {
      border-color: ${theme.colors.PRIMARY.ACCENT_5};
    }
  `}
`

const Side = styled.span<{ size: InputSizeType; styling: boolean }>`
  ${({ theme, size, styling }) => css`
    flex-shrink: 0;
    position: relative;
    color: ${theme.colors.PRIMARY.ACCENT_4};
    background: ${theme.colors.PRIMARY.ACCENT_1};
    border: 1px solid ${theme.colors.PRIMARY.ACCENT_2};
    height: 40px;
    padding: 0 12px;
    display: flex;
    align-items: center;
    transition: border-color 0.15s ease, color 0.15s ease;

    ${size === 'small' &&
    css`
      font-size: 0.875rem;
      height: 32px;
      padding: 0 8px;
    `}

    ${size === 'large' &&
    css`
      font-size: 1rem;
      height: 48px;
      padding: 0 12px;
    `}

    ${!styling &&
    css`
      background: ${theme.colors.PRIMARY.BACKGROUND};
    `}
  `}
`

const Prefix = styled(Side)`
  order: 0;
  border-right: 0;
  border-radius: 5px 0 0 5px;
`

const Suffix = styled(Side)`
  order: 2;
  border-left: 0;
  border-radius: 0 5px 5px 0;
`
