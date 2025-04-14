import Svg from '../../Svg'
import { IconProps } from '../../type'
import { useIcon } from '../../useIcon'

export const ArrowUpLeft = (props: Partial<IconProps>) => {
  const { size, color, ...otherProps } = useIcon(props)

  return (
    <Svg viewBox='0 0 24 24' width={size} height={size} stroke={color} fill='none' {...otherProps}>
      <path d='M17 17L7 7' />
      <path d='M7 17V7h10' />
    </Svg>
  )
}
