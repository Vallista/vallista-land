import Svg from '../../Svg'
import { IconProps } from '../../type'
import { useIcon } from '../../useIcon'

export const Cloud = (props: Partial<IconProps>) => {
  const { size, color, ...otherProps } = useIcon(props)

  return (
    <Svg viewBox='0 0 24 24' width={size} height={size} stroke={color} fill='none' {...otherProps}>
      <path d='M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z' />
    </Svg>
  )
}
