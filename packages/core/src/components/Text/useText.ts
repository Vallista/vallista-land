import { Colors } from '../ThemeProvider'
import { ReturningUseText, TextProps } from './type'

const initProps: Partial<TextProps> = {
  as: 'p',
  color: Colors.PRIMARY.FOREGROUND,
  size: 14,
  wrap: true
}

export function useText<T extends Partial<TextProps>>(props: T): ReturningUseText<T> {
  return {
    ...initProps,
    ...props
  }
}
