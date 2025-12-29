import { COLOR_TOKENS } from '../../theme/colorTokens'
import { IconProps, ReturningUseIcon } from './type'

const initProps: Partial<IconProps> = {
  size: 24
}

export function useIcon<T extends Partial<IconProps>>(props: T): ReturningUseIcon<T> {
  return {
    ...initProps,
    ...props,
    color: props.color ?? COLOR_TOKENS.PRIMARY.BLACK
  }
}
