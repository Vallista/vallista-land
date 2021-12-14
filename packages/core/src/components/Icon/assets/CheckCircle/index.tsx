import { FC } from 'react'

import Svg from '../../Svg'
import { IconProps } from '../../type'
import { useIcon } from '../../useIcon'

export const CheckCircle: FC<Partial<IconProps>> = (props) => {
  const { size, color, fill, ...otherProps } = useIcon(props)

  return (
    <Svg viewBox='0 0 24 24' width={size} height={size} stroke={color} fill='none' {...otherProps}>
      <path d='M22 11.08V12a10 10 0 11-5.93-9.14' />
      <path d='M22 4L12 14.01l-3-3' />
    </Svg>
  )
}
