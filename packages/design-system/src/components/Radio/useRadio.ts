import { useRadioContext } from './context'
import { UseNeedRadioProp, ReturningUseRadio } from './type'

export function useRadio<T extends UseNeedRadioProp>(props: T): T & ReturningUseRadio {
  const context = useRadioContext()
  const { disabled, uniqueId, onChange } = context

  return {
    ...props,
    value: props.value,
    name: `radio-name-${uniqueId}`,
    disabled: disabled || props.disabled || false,
    checked: props.value === context.value || false,
    onChange
  }
}
