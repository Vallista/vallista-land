import Svg from '../../Svg'
import { IconProps } from '../../type'
import { useIcon } from '../../useIcon'

export const ChevronRightCircle = (props: Partial<IconProps>) => {
  const { size, color, fill, ...otherProps } = useIcon(props)

  const stokeColor = color
  return (
    <Svg viewBox='0 0 24 24' width={size} height={size} stroke={stokeColor} fill='none' {...otherProps}>
      <path d='M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z' fill={fill} />
      <path d='M11 16l4-4-4-4' stroke={stokeColor} fill='none' />
    </Svg>
  )
}
