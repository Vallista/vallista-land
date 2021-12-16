import { css } from '@emotion/react'
import styled from '@emotion/styled'

import { IconProps } from './type'

export default styled.svg<Partial<Pick<IconProps, 'align' | 'size' | 'color'>>>`
  color: currentcolor;
  stroke: currentcolor;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  shape-rendering: geometricPrecision;
  ${(props) => css`
    ${props.align &&
    css`
      vertical-align: ${props.align === 'bottom' ? 'text-bottom' : props.align === 'top' ? 'text-top' : 'middle'};
    `}
  `};
`
