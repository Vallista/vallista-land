import { useTheme } from '@emotion/react'

import { ReturningUseButton, ButtonProps, createColorSets } from './type'

const initProps: Partial<ButtonProps> = {
  shape: 'square',
  size: 'medium',
  loading: false,
  disabled: false
}

export function useButton<T extends Partial<ButtonProps>>(props: T): ReturningUseButton<T> {
  const theme = useTheme()
  const color = props.color ?? 'primary'
  const variant = props.variant ?? 'default'
  const colorSets = createColorSets(variant, theme, color)
  return {
    ...initProps,
    ...props,
    normal: colorSets.normal,
    hover: colorSets.hover,
    active: colorSets.active
  }
}
