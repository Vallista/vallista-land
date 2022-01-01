import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { FC } from 'react'

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
  const { label, marker, children, onChange, ...otherProps } = useCheckbox(props)

  return (
    <div>
      <Label label={label} {...otherProps}>
        {label && <Caption>{label}</Caption>}
        <Input type='checkbox' {...otherProps} onChange={onChange} />
        {label && (
          <Container>
            <Box {...otherProps}>
              <svg viewBox='0 0 20 20' width='16' height='16' fill='none'>
                {marker === 'checked' && <CheckMarker d='M14 7L8.5 12.5L6 10'></CheckMarker>}
                {marker === 'indeterminate' && (
                  <IndeterminateMarker x1='5' y1='10' x2='15' y2='10'></IndeterminateMarker>
                )}
              </svg>
            </Box>
            {children && <Content>{children}</Content>}
          </Container>
        )}
        {!label && (
          <>
            <Box {...otherProps}>
              <svg viewBox='0 0 20 20' width='16' height='16' fill='none'>
                {marker === 'checked' && <CheckMarker d='M14 7L8.5 12.5L6 10'></CheckMarker>}
                {marker === 'indeterminate' && (
                  <IndeterminateMarker x1='5' y1='10' x2='15' y2='10'></IndeterminateMarker>
                )}
              </svg>
            </Box>
            {children && <Content>{children}</Content>}
          </>
        )}
      </Label>
    </div>
  )
}

const Label = styled.label<Pick<ReturningUseCheckbox, 'fullWidth' | 'disabled' | 'label'>>`
  font-size: 1em;
  display: flex;
  cursor: pointer;
  outline: none;

  ${({ fullWidth, disabled, label, theme }) => css`
    ${label &&
    css`
      flex-direction: column;
    `}

    ${!label &&
    css`
      flex-direction: row;
    `}

    ${!disabled &&
    css`
      &:hover > div {
        border-color: ${theme.colors.PRIMARY.FOREGROUND};
      }
    `}

    ${fullWidth &&
    css`
      width: 100%;
    `}

    ${disabled &&
    css`
      color: ${theme.colors.PRIMARY.ACCENT_3};
      cursor: not-allowed;
    `}
  `}
`

const Caption = styled.span`
  color: ${({ theme }) => theme.colors.PRIMARY.ACCENT_5};
  font-size: 0.98em;
  font-weight: 500;
  display: flex;
  max-width: 100%;
  margin-bottom: 8px;
  cursor: text;
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
  opacity: 0;
  outline: none;
  /* ${({ theme }) => css`
    &:focus ~ div {
      box-shadow: 0 0 0 2px ${theme.colors.PRIMARY.BACKGROUND}, 0 0 0 4px ${theme.colors.PRIMARY.ACCENT_3};
    }
  `} */
`

const Box = styled.div<Pick<ReturningUseCheckbox, 'checked' | 'disabled' | 'indeterminate'>>`
  width: 18px;
  height: 18px;
  border: 1px solid ${({ theme }) => theme.colors.PRIMARY.ACCENT_5};
  border-radius: 3px;
  transition: border-color 0.15s ease;

  ${({ checked, indeterminate, disabled, theme }) => css`
    ${disabled &&
    css`
      background-color: ${theme.colors.PRIMARY.ACCENT_1};
      border-color: ${theme.colors.PRIMARY.ACCENT_3};
    `}

    ${checked &&
    !indeterminate &&
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
`

const Container = styled.span`
  display: flex;
  flex-direction: row;
`

const Content = styled.span`
  display: flex;
  margin-left: 8px;
  align-items: flex-end;
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
