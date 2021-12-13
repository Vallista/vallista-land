import { css } from '@emotion/react'
import styled from '@emotion/styled'

import { IconProps } from './type'

export default styled.svg<Partial<Pick<IconProps, 'alignment' | 'size' | 'color'>>>`
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  shape-rendering: geometricPrecision;
  ${(props) => css`
    ${props.alignment &&
    css`
      vertical-align: props.alignment === 'bottom' ? 'text-bottom' : props.alignment === 'top' ? 'text-top' : 'middle';
    `}
  `};
`
