import { useState } from 'react'

import { InputProps, ReturningUseInput } from './type'

export function useInput<T extends Partial<InputProps>>(props: T): T & ReturningUseInput {
  const [value, setValue] = useState<string | null>(null)

  return {
    ...props,
    value: props.value ?? value ?? '',
    onChange: props.onChange ?? setValue
  }
}
