import { FC } from 'react'

import Svg from '../../Svg'
import { IconProps } from '../../type'
import { useIcon } from '../../useIcon'

export const ChevronRight: FC<Partial<IconProps>> = (props) => {
  const { size, color, ...otherProps } = useIcon(props)

  return (
    <Svg viewBox='0 0 24 24' width={size} height={size} stroke={color} fill='none' {...otherProps}>
      <path d='M9 18l6-6-6-6' />
    </Svg>
  )
}
