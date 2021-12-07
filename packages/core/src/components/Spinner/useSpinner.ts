import { ReturningUseSpinner, SpinnerProps } from './type'

const initProps: Partial<SpinnerProps> = {
  size: 20
}

export function useSpinner<T extends Partial<SpinnerProps>>(props: T): ReturningUseSpinner<T> {
  return {
    ...initProps,
    ...props
  }
}
