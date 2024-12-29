import { FC } from 'react'

import Svg from '../../Svg'
import { IconProps } from '../../type'
import { useIcon } from '../../useIcon'

export const X: FC<Partial<IconProps>> = (props) => {
  const { size, ...otherProps } = useIcon(props)

  return (
    <Svg viewBox='0 0 24 24' width={size} height={size} fill='none' {...otherProps}>
      <path d='M18 6L6 18' />
      <path d='M6 6l12 12' />
    </Svg>
  )
}
