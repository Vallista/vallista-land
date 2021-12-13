import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { VFC } from 'react'

import { StyleParams, ToggleProps } from './type'
import { useToggle } from './useToggle'

export const Toggle: VFC<Partial<ToggleProps>> = (props) => {
  const { size = 'small', toggle, onChange } = useToggle(props)

  return (
    <Label>
      <Input type='checkbox' checked={toggle} onChange={() => onChange(!toggle)} />
      <Wrapper size={size} toggle={toggle}>
        <Circle size={size} toggle={toggle} />
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
  ${({ theme }) => css`
    position: absolute;
    left: -${theme.layers.CONCEAL};
    top: -${theme.layers.CONCEAL};
    z-index: ${theme.layers.CONCEAL};
    width: 1px;
    height: 1px;
  `}
`

const Wrapper = styled.span<StyleParams>`
  ${({ theme, size, toggle }) => css`
    display: inline-block;
    width: ${sizeMapper[size].wrap[0]}px;
    height: ${sizeMapper[size].wrap[1]}px;
    transition: background 0.15s cubic-bezier(0, 0, 0.2, 1);
    background: ${toggle ? theme.colors.SUCCESS.DEFAULT : theme.colors.PRIMARY.ACCENT_2};
    /* border: 1px solid ${toggle ? theme.colors.SUCCESS.DEFAULT : theme.colors.PRIMARY.ACCENT_2}; */
    border-radius: 14px;
    cursor: pointer;
    position: relative;
  `}
`

const Circle = styled.div<StyleParams>`
  ${({ theme, size, toggle }) => css`
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
