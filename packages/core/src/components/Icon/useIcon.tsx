import { useTheme } from '@emotion/react'

import { IconProps, ReturningUseIcon } from './type'

const initProps: Partial<IconProps> = {
  size: 24
}

export function useIcon<T extends Partial<IconProps>>(props: T): ReturningUseIcon<T> {
  const theme = useTheme()
  return {
    ...initProps,
    ...props,
    color: props.color ?? theme.colors.PRIMARY.FOREGROUND
  }
}
