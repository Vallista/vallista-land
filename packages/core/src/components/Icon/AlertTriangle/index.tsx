import { useTheme } from '@emotion/react'
import React, { FC } from 'react'

import Svg from '../Svg'
import { IconProps } from '../type'

export const AlertTriangle: FC<Partial<IconProps>> = (props) => {
  const { size, color, fill, ...otherProps } = props
  const theme = useTheme()
  const stokeColor = color ?? theme.colors.PRIMARY.FOREGROUND
  const fillColor = fill ?? 'none'
  return (
    <Svg viewBox='0 0 24 24' width={size ?? 24} height={size ?? 24} stroke={stokeColor} fill='none' {...otherProps}>
      <path d='M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z' fill={fillColor} />
      <path d='M12 9v4' stroke={stokeColor} />
      <path d='M12 17h.01' stroke={stokeColor} />
    </Svg>
  )
}
