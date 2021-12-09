import { css } from '@emotion/react'
import styled from '@emotion/styled'
import React, { FC, useRef } from 'react'

import { CheckboxProps, ReturningUseCheckbox } from './type'
import { useCheckbox } from './useCheckbox'

/**
 * # Checkbox
 *
 * @description [vercel design checkbox](https://vercel.com/design/checkbox)
 *
 * 기본적인 체크박스 컴포넌트입니다. 해당 컴포넌트로 모든 체크박스를 나타냅니다.
 *
 * @param {CheckboxProps} {@link CheckboxProps} 기본적인 Checkbox 요소
 *
 * @example ```tsx
 * const [checked, setChecked] = useState(false)
 * <Checkbox checked={checked} onChange={() => setChecked(!checked)}>CheckBox</Checkbox>

 * ```
 */
export const Checkbox: FC<Partial<CheckboxProps>> = (props) => {
  const elementProps = useCheckbox(props)
  const ref = useRef<HTMLInputElement>(null)

  const {
    fullWidth,
    style,
    label,
    checked,
    disabled,
    isFocus,
    isHover,
    marker,
    children,
    onInputChange,
    onFocus,
    onBlur,
    onMouseEnter,
    onMouseLeave,
    onCheckboxClick
  } = elementProps

  return (
    <Label
      fullWidth={fullWidth}
      label={label}
      disabled={disabled}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={style}
      onClick={() => onCheckboxClick(ref)}
    >
      {label && <LabelText>{label}</LabelText>}
      <Input
        ref={ref}
        type={'checkbox'}
        checked={checked}
        disabled={disabled}
        onChange={onInputChange}
        onFocus={onFocus}
        onBlur={onBlur}
      />
      <Box checked={checked} isFocus={isFocus} isHover={isHover} disabled={disabled} label={label}>
        <svg viewBox={'0 0 20 20'} width={16} height={16} fill={'none'}>
          {marker === 'checked' && <CheckMarker d={'M14 7L8.5 12.5L6 10'}></CheckMarker>}
          {marker === 'indeterminate' && <IndeterminateMarker x1={5} y1={10} x2={15} y2={10}></IndeterminateMarker>}
        </svg>
      </Box>
      {children && <Content>{children}</Content>}
    </Label>
  )
}

const Label = styled.label<Pick<ReturningUseCheckbox, 'fullWidth' | 'disabled' | 'label'>>`
  font-size: 0.875rem;

  ${({ label }) => css`
    ${!label &&
    css`
      align-items: flex-start;
      flex-direction: column;
      display: inline-flex;
    `}
  `}

  ${({ fullWidth }) => css`
    ${fullWidth &&
    css`
      width: 100%;
    `}
  `}

  ${({ disabled, theme }) => css`
    ${disabled &&
    css`
      cursor: not-allowed;
      color: ${theme.colors.PRIMARY.ACCENT_3};
    `}
  `}
`

const LabelText = styled.div`
  cursor: text;
  display: block;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  max-width: 100%;
  color: ${({ theme }) => theme.colors.PRIMARY.ACCENT_5};
  margin-bottom: 8px;
`

const Input = styled.input`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
`

const Box = styled.span<Pick<ReturningUseCheckbox, 'checked' | 'isFocus' | 'isHover' | 'disabled' | 'label'>>`
  border: 1px solid ${({ theme }) => theme.colors.PRIMARY.ACCENT_5};
  border-radius: 3px;
  width: 1rem;
  height: 1rem;
  position: relative;
  transition: border-color 0.15s ease;
  transform: rotate(0.000001deg);

  ${({ label }) => css`
    ${label &&
    css`
      display: inline-flex;
    `}
  `}

  ${({ disabled, theme }) => css`
    ${disabled &&
    css`
      background-color: ${theme.colors.PRIMARY.ACCENT_1};
      border-color: ${theme.colors.PRIMARY.ACCENT_3};
    `}
  `}

  ${({ checked, disabled, theme }) => css`
    ${checked &&
    css`
      background-color: ${theme.colors.PRIMARY.FOREGROUND};
      border-color: ${theme.colors.PRIMARY.FOREGROUND};

      ${disabled &&
      css`
        background-color: ${theme.colors.PRIMARY.ACCENT_3};
        border-color: ${theme.colors.PRIMARY.ACCENT_3};
      `}
    `}
  `}

  ${({ isFocus, theme }) => css`
    ${isFocus &&
    css`
      box-shadow: 0 0 0 2px ${theme.colors.PRIMARY.BACKGROUND}, 0 0 0 4px ${theme.colors.PRIMARY.ACCENT_3};
    `}
  `}

  ${({ isHover, theme }) => css`
    ${isHover &&
    css`
      border-color: ${theme.colors.PRIMARY.FOREGROUND};
    `}
  `}
`

const Content = styled.span`
  margin-left: 8px;
`

const CheckMarker = styled.path`
  stroke: ${({ theme }) => theme.colors.PRIMARY.BACKGROUND};
  stroke-width: 2;
  stroke-linecap: 'round';
  stroke-linejoin: 'round';
`

const IndeterminateMarker = styled.line`
  stroke: ${({ theme }) => theme.colors.PRIMARY.ACCENT_5};
  stroke-width: 2;
  stroke-linecap: 'round';
  stroke-linejoin: 'round';
`
