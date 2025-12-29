import { ButtonProps } from './type'

const initProps: Partial<ButtonProps> = {
  shape: 'square',
  size: 'medium',
  loading: false,
  disabled: false,
  variant: 'default',
  color: 'primary',
  type: 'button'
}

export function useButton<T extends Partial<ButtonProps>>(props: T): T {
  return {
    ...initProps,
    ...props
  }
}
