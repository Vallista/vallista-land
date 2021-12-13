import { AvailablePickedColor } from '../ThemeProvider/type'

export interface IconProps {
  size: number
  fill: AvailablePickedColor
  color: AvailablePickedColor
  alignment: 'top' | 'middle' | 'bottom'
}

export type ReturningUseIcon<T extends Partial<IconProps> = Partial<IconProps>> = T
