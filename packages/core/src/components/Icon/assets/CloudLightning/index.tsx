import React, { FC } from 'react'

import Svg from '../../Svg'
import { IconProps } from '../../type'
import { useIcon } from '../../useIcon'

export const CloudLightning: FC<Partial<IconProps>> = (props) => {
  const { size, color, fill, ...otherProps } = useIcon(props)

  return (
    <Svg viewBox='0 0 24 24' width={size} height={size} stroke={color} fill='none' {...otherProps}>
      <path d='M19 16.9A5 5 0 0018 7h-1.26a8 8 0 10-11.62 9' />
      <path d='M13 11l-4 6h6l-4 6' />
    </Svg>
  )
}
