import { SpinnerProps, ReturningUseSpinner } from './type'

const initProps: Partial<SpinnerProps> = {
  size: 24
}

export function useSpinner<T extends Partial<SpinnerProps>>(props: T): ReturningUseSpinner<T> {
  return {
    ...initProps,
    ...props,
    size: props.size ?? initProps.size!,
    'aria-label': props['aria-label'] ?? 'Loading...'
  }
}
