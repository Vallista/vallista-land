import { useTheme } from '@emotion/react'
import React, { FC } from 'react'

import Svg from '../Svg'
import { IconProps } from '../type'

export const BookOpen: FC<Partial<IconProps>> = (props) => {
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
      <path d='M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z' />
      <path d='M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z' />
    </Svg>
  )
}
