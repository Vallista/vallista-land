import { LoadingDotsProps } from './type'

export function useLoadingDots<T extends Partial<LoadingDotsProps>>(props: T): T {
  const { size = 2 } = props

  return {
    ...props,
    size
  }
}
