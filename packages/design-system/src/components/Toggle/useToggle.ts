import { useControlledState } from '../../hooks/useControlledState'
import { ReturningUseToggle, ToggleProps } from './type'

export function useToggle<T extends Partial<ToggleProps>>(props: T): ReturningUseToggle {
  const [toggle, onChange] = useControlledState(props.toggle, props.toggle, props.onChange)

  return {
    ...props,
    toggle: toggle ?? false,
    onChange
  }
}
