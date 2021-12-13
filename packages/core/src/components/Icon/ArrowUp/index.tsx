import { useTheme } from '@emotion/react'
import React, { FC } from 'react'

import Svg from '../Svg'
import { IconProps } from '../type'

export const ArrowUp: FC<Partial<IconProps>> = (props) => {
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
      <path d='M12 19V5' />
      <path d='M5 12l7-7 7 7' />
    </Svg>
  )
}
