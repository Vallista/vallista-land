import { useTheme } from '@emotion/react'
import React, { FC } from 'react'

import Svg from '../Svg'
import { IconProps } from '../type'

export const ArrowDownCircle: FC<Partial<IconProps>> = (props) => {
  const { size, color, fill, ...otherProps } = props
  const theme = useTheme()
  const strokeColor = color ?? theme.colors.PRIMARY.FOREGROUND
  return (
    <Svg viewBox='0 0 24 24' width={size ?? 24} height={size ?? 24} stroke={strokeColor} fill='none' {...otherProps}>
      <circle cx='12' cy='12' r='10' fill={fill} />
      <path d='M8 12l4 4 4-4' stroke={strokeColor} />
      <path d='M12 8v8' stroke={strokeColor} />
    </Svg>
  )
}
