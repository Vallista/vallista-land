import { Colors } from '../ThemeProvider'
import { ReturningUseSpinner, SpinnerProps } from './type'

const initProps: Partial<SpinnerProps> = {}

export function useSpinner<T extends Partial<SpinnerProps>>(props: T): ReturningUseSpinner<T> {
  return {
    ...initProps,
    ...props
  }
}
