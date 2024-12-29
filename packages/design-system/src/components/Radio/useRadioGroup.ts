import { useControlledState } from '../../hooks/useControlledState'
import { ReturningUseRadioGroup, RadioGroupProps } from './type'

export function useRadioGroup<T extends Partial<RadioGroupProps>>(props: T): ReturningUseRadioGroup {
  const [value, onChange] = useControlledState(props.value, props.value, props.onChange)

  return {
    ...props,
    value: value ?? '',
    onChange
  }
}
