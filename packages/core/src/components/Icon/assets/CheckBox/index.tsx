import React, { FC } from 'react'

import Svg from '../../Svg'
import { IconProps } from '../../type'
import { useIcon } from '../../useIcon'
import { useIcon } from '../../useIcon'

export const CheckBox: FC<Partial<IconProps>> = (props) => {
  const { size, color, fill, ...otherProps } = useIcon(props)

  return (
    <Svg viewBox='0 0 24 24' width={size} height={size} stroke={color} fill='none' {...otherProps}>
      <path d='M16.09 3H7.91A4.91 4.91 0 003 7.91v8.18A4.909 4.909 0 007.91 21h8.18A4.909 4.909 0 0021 16.09V7.91A4.909 4.909 0 0016.09 3z' />
    </Svg>
  )
}
