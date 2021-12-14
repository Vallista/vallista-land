import React, { FC } from 'react'

import Svg from '../../Svg'
import { IconProps } from '../../type'
import { useIcon } from '../../useIcon'

export const Anchor: FC<Partial<IconProps>> = (props) => {
  const { size, color, fill, ...otherProps } = useIcon(props)

  return (
    <Svg viewBox='0 0 24 24' width={size} height={size} stroke={color} fill='none' {...otherProps}>
      <circle cx='12' cy='5' r='3' />
      <path d='M12 22V8' />
      <path d='M5 12H2a10 10 0 0020 0h-3' />
    </Svg>
  )
}
