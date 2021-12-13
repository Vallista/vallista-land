import { useTheme } from '@emotion/react'
import React, { FC } from 'react'

import Svg from '../Svg'
import { IconProps } from '../type'

export const ChevronUpCircle: FC<Partial<IconProps>> = (props) => {
  const { size, color, fill, ...otherProps } = props
  const theme = useTheme()
  const stokeColor = color ?? theme.colors.PRIMARY.FOREGROUND
  return (
    <Svg viewBox='0 0 24 24' width={size ?? 24} height={size ?? 24} stroke={stokeColor} {...otherProps}>
      <path d='M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z' fill={fill} />
      <path d='M16 14l-4-4-4 4' stroke={stokeColor} fill='none' />
    </Svg>
  )
}
