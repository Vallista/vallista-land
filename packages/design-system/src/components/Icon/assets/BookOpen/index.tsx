import { FC } from 'react'

import Svg from '../../Svg'
import { IconProps } from '../../type'
import { useIcon } from '../../useIcon'

export const BookOpen: FC<Partial<IconProps>> = (props) => {
  const { size, color, ...otherProps } = useIcon(props)

  return (
    <Svg viewBox='0 0 24 24' width={size} height={size} stroke={color} fill='none' {...otherProps}>
      <path d='M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z' />
      <path d='M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z' />
    </Svg>
  )
}
