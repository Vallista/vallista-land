import { useTheme } from '@emotion/react'
import React, { FC } from 'react'

import Svg from '../Svg'
import { IconProps } from '../type'

export const BellOff: FC<Partial<IconProps>> = (props) => {
  const { size, color, fill, ...otherProps } = props
  const theme = useTheme()
  return (
    <Svg
      viewBox='0 0 24 24'
      width={size ?? 24}
      height={size ?? 24}
      stroke={color ?? theme.colors.PRIMARY.FOREGROUND}
      fill='none'
      {...otherProps}
    >
      <path d='M13.73 21a2 2 0 01-3.46 0' />
      <path d='M18.63 13A17.89 17.89 0 0118 8' />
      <path d='M6.26 6.26A5.86 5.86 0 006 8c0 7-3 9-3 9h14' />
      <path d='M18 8a6 6 0 00-9.33-5' />
      <path d='M1 1l22 22' />
    </Svg>
  )
}
