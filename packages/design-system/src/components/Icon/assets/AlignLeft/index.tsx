import Svg from '../../Svg'
import { IconProps } from '../../type'
import { useIcon } from '../../useIcon'

export const AlignLeft = (props: Partial<IconProps>) => {
  const { size, color, ...otherProps } = useIcon(props)

  return (
    <Svg viewBox='0 0 24 24' width={size} height={size} stroke={color} fill='none' {...otherProps}>
      <path d='M17 10H3' />
      <path d='M21 6H3' />
      <path d='M21 14H3' />
      <path d='M17 18H3' />
    </Svg>
  )
}
