import Svg from '../../Svg'
import { IconProps } from '../../type'
import { useIcon } from '../../useIcon'

export const BarChart2 = (props: Partial<IconProps>) => {
  const { size, color, ...otherProps } = useIcon(props)

  return (
    <Svg viewBox='0 0 24 24' width={size} height={size} stroke={color} fill='none' {...otherProps}>
      <path d='M18 20V10' />
      <path d='M12 20V4' />
      <path d='M6 20v-6' />
    </Svg>
  )
}
