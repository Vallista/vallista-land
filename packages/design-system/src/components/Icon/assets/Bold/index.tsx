import { FC } from 'react'

import Svg from '../../Svg'
import { IconProps } from '../../type'
import { useIcon } from '../../useIcon'

export const Bold: FC<Partial<IconProps>> = (props) => {
  const { size, color, ...otherProps } = useIcon(props)

  return (
    <Svg viewBox='0 0 24 24' width={size} height={size} stroke={color} fill='none' {...otherProps}>
      <path d='M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z' />
      <path d='M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z' />
    </Svg>
  )
}
