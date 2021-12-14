import React, { FC } from 'react'

import Svg from '../../Svg'
import { IconProps } from '../../type'
import { useIcon } from '../../useIcon'

export const Calendar: FC<Partial<IconProps>> = (props) => {
  const { size, color, fill, ...otherProps } = useIcon(props)

  return (
    <Svg viewBox='0 0 24 24' width={size} height={size} stroke={color} fill='none' {...otherProps}>
      <rect x='3' y='4' width='18' height='18' rx='2' ry='2' />
      <path d='M16 2v4' />
      <path d='M8 2v4' />
      <path d='M3 10h18' />
    </Svg>
  )
}
