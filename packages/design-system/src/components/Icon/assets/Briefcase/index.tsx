import Svg from '../../Svg'
import { IconProps } from '../../type'
import { useIcon } from '../../useIcon'

export const Briefcase = (props: Partial<IconProps>) => {
  const { size, color, ...otherProps } = useIcon(props)

  return (
    <Svg viewBox='0 0 24 24' width={size} height={size} stroke={color} fill='none' {...otherProps}>
      <rect x='2' y='7' width='20' height='14' rx='2' ry='2' />
      <path d='M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16' />
    </Svg>
  )
}
