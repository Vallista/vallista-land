import { FC } from 'react'

import { useUniqueId } from '../../hooks/useUniqueId'
import { RadioContext } from './context'
import { RadioGroupProps } from './type'
import { useRadioGroup } from './useRadioGroup'

export const RadioGroup: FC<Partial<RadioGroupProps>> = ({ children, ...props }) => {
  const state = useRadioGroup(props)
  const uniqueId = useUniqueId()

  return (
    <RadioContext
      state={{
        uniqueId,
        ...state
      }}
    >
      {children}
    </RadioContext>
  )
}
