import type { AvailablePickedColor } from '../ThemeProvider'

export interface TextProps {
  as: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'small' | 'span' | 'div' | 'label' | 'string'
  size: 10 | 12 | 14 | 16 | 20 | 24 | 32 | 40 | 48
  lineHeight: 12 | 16 | 20 | 24 | 32 | 40 | 48 | 56
  weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900
  transform: 'capitalize' | 'uppercase' | 'lowercase'
  align: 'left' | 'center' | 'right'
  color: AvailablePickedColor
  wrap: boolean
}

export type ReturningUseText<T extends Partial<TextProps> = Partial<TextProps>> = T & {
  // Element: React.ElementType
}
