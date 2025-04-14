import Svg from '../../Svg'
import { IconProps } from '../../type'
import { useIcon } from '../../useIcon'

export const ChevronsRight = (props: Partial<IconProps>) => {
  const { size, color, ...otherProps } = useIcon(props)

  return (
    <Svg viewBox='0 0 24 24' width={size} height={size} stroke={color} fill='none' {...otherProps}>
      <path d='M13 17l5-5-5-5' />
      <path d='M6 17l5-5-5-5' />
    </Svg>
  )
}
