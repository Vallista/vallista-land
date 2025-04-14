import Svg from '../../Svg'
import { IconProps } from '../../type'
import { useIcon } from '../../useIcon'

export const CloudDrizzle = (props: Partial<IconProps>) => {
  const { size, color, ...otherProps } = useIcon(props)

  return (
    <Svg viewBox='0 0 24 24' width={size} height={size} stroke={color} fill='none' {...otherProps}>
      <path d='M8 19v2' />
      <path d='M8 13v2' />
      <path d='M16 19v2' />
      <path d='M16 13v2' />
      <path d='M12 21v2' />
      <path d='M12 15v2' />
      <path d='M20 16.58A5 5 0 0018 7h-1.26A8 8 0 104 15.25' />
    </Svg>
  )
}
