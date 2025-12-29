import { useState, useCallback } from 'react'

import { InputProps, ReturningUseInput } from './type'

const initProps: Partial<InputProps> = {
  size: 'medium',
  prefixStyling: true,
  suffixStyling: true,
  disabled: false,
  type: 'text'
}

export function useInput<T extends Partial<InputProps>>(props: T): T & ReturningUseInput {
  const [internalValue, setInternalValue] = useState<string>('')

  const { onChange: onChangeProp } = props

  const handleChange = useCallback(
    (newValue: string) => {
      if (onChangeProp) {
        onChangeProp(newValue)
      } else {
        setInternalValue(newValue)
      }
    },
    [onChangeProp]
  )

  return {
    ...initProps,
    ...props,
    value: props.value ?? internalValue,
    onChange: handleChange
  }
}
