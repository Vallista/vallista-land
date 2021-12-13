import { useRadioContext } from './context'
import { NeedRadioProp, ReturningUseRadio } from './type'

export function useRadio<T extends NeedRadioProp>(props: T): T & ReturningUseRadio {
  const { state } = useRadioContext()
  const { disabled } = state

  return {
    ...props,
    ...state,
    value: props.value,
    name: `radio-name-${state.uniqueId}`,
    disabled: disabled || props.disabled || false,
    checked: props.value === state.value || false
  }
}
