import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { FC, forwardRef } from 'react'

import { NeedRadioProp } from './type'
import { useRadio } from './useRadio'

/**
 * # Radio
 *
 * @description [vercel design radio](https://vercel.com/design/radio)
 *
 * 라디오 컴포넌트 입니다. {@link RadioGroup}과 같이 사용해야합니다.
 *
 * @param {RadioProps} {@link RadioProps} 기본적인 Radio 요소
 *
 * @example ```tsx
 * <Radio value='value1' />
 * <Radio value='value2' />
 * ```
 */
export const Radio: FC<NeedRadioProp> = forwardRef<HTMLInputElement, NeedRadioProp>(({ children, ...props }, ref) => {
  const { onChange, ...otherProps } = useRadio(props)

  return (
    <Label {...otherProps}>
      <Circle {...otherProps}>
        <Input type='radio' ref={ref} {...otherProps} onChange={handleChange} />
        <InnerCircle />
      </Circle>
      <Text>{children}</Text>
    </Label>
  )

  function handleChange(): void {
    onChange(otherProps.value)
  }
})

const Label = styled.label<{ disabled: boolean }>`
  display: inline-flex;
  align-items: flex-start;
  font-size: 0.9rem;
  ${({ theme, disabled }) => css`
    color: ${disabled ? theme.colors.PRIMARY.ACCENT_3 : theme.colors.PRIMARY.FOREGROUND};
    cursor: ${disabled ? 'not-allowed' : 'pointer'};
  `}
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

  &:checked + span:after {
    transform: translate(-50%, -50%) scale(1);
  }

  ${({ theme }) => css`
    &:checked + span {
      border-color: ${theme.colors.PRIMARY.FOREGROUND};
    }

    &:hover + span {
      border-color: ${theme.colors.PRIMARY.FOREGROUND};
    }

    &:disabled + span {
      border-color: ${theme.colors.PRIMARY.ACCENT_3};
    }
  `}
`

const Circle = styled.span<{ disabled: boolean }>`
  display: flex;
  align-items: center;
  padding: 2px;
  margin: -2px;
  ${({ disabled }) => css`
    cursor: ${disabled ? 'not-allowed' : 'pointer'};
  `}
`

const InnerCircle = styled.span`
  position: relative;
  ${({ theme }) => css`
    border: 1px solid ${theme.colors.PRIMARY.ACCENT_5};
    border-radius: 50%;
    width: 14px;
    height: 14px;
    transition: border-color 0.15s ease;

    &:after {
      transform: translate(-50%, -50%) scale(0);
      content: '';
      display: block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      position: absolute;
      top: 50%;
      left: 50%;
      background: ${theme.colors.PRIMARY.FOREGROUND};
      transition: transform 0.15s ease;
    }
  `}
`

const Text = styled.span`
  margin-left: 0.5rem;
`
