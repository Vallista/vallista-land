/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react'

import { useUniqueId } from '../../hooks/useUniqueId'
import { createContext } from '../../utils/createContext'
import { ModalAnimationState, ModalContextStateWithProps, ModalProps } from './type'

const [context, useContext] = createContext<ModalContextStateWithProps>()

export const ModalContext = context

export const ModalProvider = (props: Partial<ModalProps>) => {
  const { children, ...otherProps } = props

  const [animationState, setAnimationState] = useState<ModalAnimationState>(ModalAnimationState.IDLE)
  const uniqueId = useUniqueId()

  return (
    <ModalContext
      uniqueId={uniqueId}
      animationState={animationState}
      changeAnimationState={changeAnimationState}
      nextAnimationState={nextAnimationState}
      {...otherProps}
    >
      {children}
    </ModalContext>
  )

  function changeAnimationState(state_: ModalAnimationState): void {
    setAnimationState(() => state_)
  }

  function nextAnimationState(): void {
    setAnimationState((state_) => {
      const next = state_ + 1
      if (next === ModalAnimationState.DEAD) return ModalAnimationState.IDLE
      return next
    })
  }
}

// export const useModalContext = useContext
export function useModalContext<T>(props: T): T & ModalContextStateWithProps {
  const context = useContext()

  return {
    ...props,
    ...context
  }
}
