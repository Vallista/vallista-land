import { NeedSwitchProp, ReturningUseSwitch, SwitchProps } from './type'

const initProps: Pick<SwitchProps, 'size'> = {
  size: 'medium'
}

export const useSwitch = <T extends NeedSwitchProp>(props: T): ReturningUseSwitch => {
  return {
    ...initProps,
    ...props,
    size: props.size || 'medium'
  }
}
