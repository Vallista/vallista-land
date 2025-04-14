import Svg from '../../Svg'
import { IconProps } from '../../type'
import { useIcon } from '../../useIcon'

export const Clock = (props: Partial<IconProps>) => {
  const { size, color, ...otherProps } = useIcon(props)

  return (
    <Svg viewBox='0 0 24 24' width={size} height={size} stroke={color} fill='none' {...otherProps}>
      <circle cx='12' cy='12' r='10' />
      <path d='M12 6v6l4 2' />
    </Svg>
  )
}
