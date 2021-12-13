import { useTheme } from '@emotion/react'
import React, { FC } from 'react'

import Svg from '../Svg'
import { IconProps } from '../type'

export const CloudDrizzle: FC<Partial<IconProps>> = (props) => {
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
      <path d='M8 19v2' />
      <path d='M8 13v2' />
      <path d='M16 19v2' />
      <path d='M16 13v2' />
      <path d='M12 21v2' />
      <path d='M12 15v2' />
      <path d='M20 16.58A5 5 0 0018 7h-1.26A8 8 0 104 15.25' />
    </Svg>
  )
}
