import { useTheme } from '@emotion/react'
import React, { FC } from 'react'

import Svg from '../Svg'
import { IconProps } from '../type'

export const Archive: FC<Partial<IconProps>> = (props) => {
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
      <path d='M21 8v13H3V8' />
      <path d='M1 3h22v5H1z' />
      <path d='M10 12h4' />
    </Svg>
  )
}
