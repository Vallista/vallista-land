import { FC } from 'react'

import Svg from '../../Svg'
import { IconProps } from '../../type'
import { useIcon } from '../../useIcon'

export const CloudSnow: FC<Partial<IconProps>> = (props) => {
  const { size, color, ...otherProps } = useIcon(props)

  return (
    <Svg viewBox='0 0 24 24' width={size} height={size} stroke={color} fill='none' {...otherProps}>
      <path d='M20 17.58A5 5 0 0018 8h-1.26A8 8 0 104 16.25' />
      <path d='M8 16h.01' />
      <path d='M8 20h.01' />
      <path d='M12 18h.01' />
      <path d='M12 22h.01' />
      <path d='M16 16h.01' />
      <path d='M16 20h.01' />
    </Svg>
  )
}
