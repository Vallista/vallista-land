import { useTheme } from '@emotion/react'
import React, { FC } from 'react'

import Svg from '../Svg'
import { IconProps } from '../type'

export const CheckInCircle: FC<Partial<IconProps>> = (props) => {
  const { size, color, fill, ...otherProps } = props
  const theme = useTheme()
  const strokeColor = color ?? theme.colors.PRIMARY.FOREGROUND
  return (
    <svg viewBox='0 0 24 24' width={size ?? 24} height={size ?? 24} stroke={strokeColor} fill='none' {...otherProps}>
      <path
        d='M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z'
        fill={fill}
        stroke={fill}
      />
      <path d='M8 11.8571L10.5 14.3572L15.8572 9' fill='none' stroke={strokeColor} />
    </svg>
  )
}
