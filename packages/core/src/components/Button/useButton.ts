import { Colors } from '../ThemeProvider'
import { ReturningUseButton, ButtonProps, colorVariantSets } from './type'

const initProps: Partial<ButtonProps> = {
  shape: 'square',
  size: 'medium',
  loading: false,
  disabled: false
}

export function useButton<T extends Partial<ButtonProps>>(props: T): ReturningUseButton<T> {
  const color = props.color || 'primary'
  const variant = props.variant || 'default'
  return {
    ...initProps,
    ...props,
    normal: colorVariantSets[variant][color].normal,
    hover: colorVariantSets[variant][color].hover,
    active: colorVariantSets[variant][color].active
  }
}
