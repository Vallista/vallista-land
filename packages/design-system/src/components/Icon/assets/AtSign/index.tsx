import Svg from '../../Svg'
import { IconProps } from '../../type'
import { useIcon } from '../../useIcon'

export const AtSign = (props: Partial<IconProps>) => {
  const { size, color, ...otherProps } = useIcon(props)

  return (
    <Svg viewBox='0 0 24 24' width={size} height={size} stroke={color} fill='none' {...otherProps}>
      <circle cx='12' cy='12' r='4' />
      <path d='M16 8v5a3 3 0 006 0v-1a10 10 0 10-3.92 7.94' />
    </Svg>
  )
}
