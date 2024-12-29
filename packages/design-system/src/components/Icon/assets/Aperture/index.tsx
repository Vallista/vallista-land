import { FC } from 'react'

import Svg from '../../Svg'
import { IconProps } from '../../type'
import { useIcon } from '../../useIcon'

export const Aperture: FC<Partial<IconProps>> = (props) => {
  const { size, color, ...otherProps } = useIcon(props)

  return (
    <Svg viewBox='0 0 24 24' width={size} height={size} stroke={color} fill='none' {...otherProps}>
      <circle cx='12' cy='12' r='10' />
      <path d='M14.31 8l5.74 9.94' />
      <path d='M9.69 8h11.48' />
      <path d='M7.38 12l5.74-9.94' />
      <path d='M9.69 16L3.95 6.06' />
      <path d='M14.31 16H2.83' />
      <path d='M16.62 12l-5.74 9.94' />
    </Svg>
  )
}
