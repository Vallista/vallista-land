import Svg from '../../Svg'
import { IconProps } from '../../type'
import { useIcon } from '../../useIcon'

export const AlignCenter = (props: Partial<IconProps>) => {
  const { size, color, ...otherProps } = useIcon(props)

  return (
    <Svg viewBox='0 0 24 24' width={size} height={size} stroke={color} fill='none' {...otherProps}>
      <path d='M18 10H6' />
      <path d='M21 6H3' />
      <path d='M21 14H3' />
      <path d='M18 18H6' />
    </Svg>
  )
}
