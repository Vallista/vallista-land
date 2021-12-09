import { CheckboxProps, ReturningUseCheckbox } from './type'

const initProps: Partial<CheckboxProps> = {
  checked: false,
  indeterminate: false,
  disabled: false,
  fullWidth: false,
  onChange: (): void => {
    //
  }
}

export const useCheckbox = <T extends Partial<CheckboxProps>>(props: T): ReturningUseCheckbox => {
  return {
    ...initProps,
    ...props,
    onChange: () => {
      !props.indeterminate && props.onChange && props.onChange()
    },
    marker: props.indeterminate ? 'indeterminate' : props.checked ? 'checked' : 'none'
  }
}
