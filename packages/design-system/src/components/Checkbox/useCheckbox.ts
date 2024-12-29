import { CheckboxProps, ReturningUseCheckbox } from './type'

const initProps: Partial<CheckboxProps> = {
  checked: false,
  indeterminate: false,
  disabled: false,
  fullWidth: false,
  onChange: () => void 0
}

export const useCheckbox = <T extends Partial<CheckboxProps>>(props: T): ReturningUseCheckbox => {
  return {
    ...initProps,
    ...props,
    onChange: () => {
      if (!props.indeterminate && props.onChange) props.onChange()
    },
    marker: props.indeterminate ? 'indeterminate' : props.checked ? 'checked' : 'none'
  }
}
