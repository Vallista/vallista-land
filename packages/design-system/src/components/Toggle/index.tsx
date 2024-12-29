import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { VFC } from 'react'

import { StyleParams, ToggleProps } from './type'
import { useToggle } from './useToggle'

/**
 * # Toggle
 *
 * @description [vercel design toggle](https://vercel.com/design/toggle)
 *
 * 토글 컴포넌트입니다. 해당 컴포넌트로 토글을 나타냅니다.
 *
 * @param {ToggleProps} {@link ToggleProps} toggle 요소
 *
 * @example ```tsx
 * const [state, setState] = useState(false)
 *
 * <Toggle size="small" toggle={state} onChange={setState} />
 * ```
 */
export const Toggle: VFC<Partial<ToggleProps>> = (props) => {
  const { size = 'small', color = 'blue', onChange, ...otherProps } = useToggle(props)

  return (
    <Label>
      <Input
        type='checkbox'
        checked={otherProps.toggle}
        onChange={() => onChange(!otherProps.toggle)}
        {...otherProps}
      />
      <Wrapper size={size} {...otherProps} color={color}>
        <Circle size={size} {...otherProps} color={color} />
      </Wrapper>
    </Label>
  )
}

const Label = styled.label`
  display: inline-flex;
  position: relative;
  vertical-align: middle;
  white-space: nowrap;
  user-select: none;
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
`

const Wrapper = styled.span<StyleParams>`
  ${({ theme, size, toggle, disabled, color }) => css`
    display: inline-block;
    width: ${sizeMapper[size].wrap[0]}px;
    height: ${sizeMapper[size].wrap[1]}px;
    transition: background 0.15s cubic-bezier(0, 0, 0.2, 1);
    background: ${toggle
      ? color === 'blue'
        ? theme.colors.SUCCESS.DEFAULT
        : theme.colors.HIGHLIGHT.PINK
      : theme.colors.PRIMARY.ACCENT_2};
    border: 1px solid
      ${toggle
        ? color === 'blue'
          ? theme.colors.SUCCESS.DEFAULT
          : theme.colors.HIGHLIGHT.PINK
        : theme.colors.PRIMARY.ACCENT_2};
    border-radius: 14px;
    cursor: pointer;
    position: relative;
    box-sizing: border-box;

    ${disabled &&
    css`
      background: ${theme.colors.PRIMARY.ACCENT_1};
      border-color: ${theme.colors.PRIMARY.ACCENT_2};
      cursor: not-allowed;
    `}
  `}
`

const Circle = styled.div<StyleParams>`
  ${({ theme, size, toggle, disabled }) => css`
    position: absolute;
    left: 0;
    top: 50%;
    width: ${sizeMapper[size].circle[0]}px;
    height: ${sizeMapper[size].circle[1]}px;
    transition: transform 0.15s cubic-bezier(0, 0, 0.2, 1);
    transform: translate(${toggle ? sizeMapper[size].pos[1] : sizeMapper[size].pos[0]}px, -50%);
    background: ${theme.colors.PRIMARY.BACKGROUND};
    cursor: pointer;
    border-radius: 50%;
    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 20%), 0 1px 3px 0 rgb(0 0 0 / 10%);
    border: 1px solid transparent;

    ${disabled &&
    css`
      background: ${theme.colors.PRIMARY.ACCENT_2};
      cursor: not-allowed;
    `}
  `}
`

const sizeMapper: Record<
  ToggleProps['size'],
  { wrap: [number, number]; circle: [number, number]; pos: [number, number] }
> = {
  small: {
    wrap: [28, 14],
    circle: [12, 12],
    pos: [1, 15]
  },
  medium: {
    wrap: [34, 18],
    circle: [16, 16],
    pos: [1, 17]
  },
  large: {
    wrap: [40, 24],
    circle: [22, 22],
    pos: [1, 17]
  }
}
