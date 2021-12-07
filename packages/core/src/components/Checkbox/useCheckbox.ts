import { ChangeEvent, RefObject, useState } from 'react'

import { CheckboxMarkerType, CheckboxProps, ReturningUseCheckbox } from './type'

const initProps: Partial<CheckboxProps> = {
  checked: false,
  indeterminate: false,
  disabled: false,
  fullWidth: false,
  onChange: (_: ChangeEvent<HTMLInputElement>): void => {
    //
  }
}

export const useCheckbox = <T extends Partial<CheckboxProps>>(props: T): ReturningUseCheckbox => {
  const [focus, setFocus] = useState(false)
  const [hover, setHover] = useState(false)

  let marker: CheckboxMarkerType = 'none'
  if (props.indeterminate) {
    marker = 'indeterminate'
  } else if (props.checked) {
    marker = 'checked'
  }

  return {
    ...initProps,
    ...props,
    marker,
    onCheckboxClick: (inputRef: RefObject<HTMLInputElement>): void => {
      if (props.indeterminate) {
        return
      }
      inputRef.current?.click()
    },
    onInputChange: (event: ChangeEvent<HTMLInputElement>): void => {
      if (props.indeterminate) {
        return
      }
      props.onChange && props.onChange(event)
    },
    isFocus: focus,
    onFocus: () => {
      if (props.disabled) {
        return
      }
      setFocus(true)
    },
    onBlur: () => {
      if (props.disabled) {
        return
      }
      setFocus(false)
    },
    isHover: hover,
    onMouseEnter: () => {
      if (props.disabled) {
        return
      }
      setHover(true)
    },
    onMouseLeave: () => {
      if (props.disabled) {
        return
      }
      setHover(false)
    }
  }
}
