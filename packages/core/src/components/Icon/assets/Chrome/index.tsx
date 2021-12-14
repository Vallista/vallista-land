import React, { FC } from 'react'

import Svg from '../../Svg'
import { IconProps } from '../../type'
import { useIcon } from '../../useIcon'

export const Chrome: FC<Partial<IconProps>> = (props) => {
  const { size, color, fill, ...otherProps } = useIcon(props)

  return (
    <Svg viewBox='0 0 24 24' width={size} height={size} stroke={color} fill='none' {...otherProps}>
      <circle cx='12' cy='12' r='10' />
      <circle cx='12' cy='12' r='4' />
      <path d='M21.17 8H12' />
      <path d='M3.95 6.06L8.54 14' />
      <path d='M10.88 21.94L15.46 14' />
    </Svg>
  )
}
