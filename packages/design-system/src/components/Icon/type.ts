export interface IconProps {
  size: number
  fill: string
  color: string
  align: 'top' | 'middle' | 'bottom'
}

export type ReturningUseIcon<T extends Partial<IconProps> = Partial<IconProps>> = T
