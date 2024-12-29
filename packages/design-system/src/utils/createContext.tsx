import React from 'react'

import { ErrorMessage } from '../constants/messages'

type Consumer<C> = () => C
type Nullable<C> = C | null

/**
 * Context 인터페이스
 *
 * Context에서 어떤 일을 하는지에 따라 확장할 수 있도록 중간 레이어를 둔 것
 */
export interface ContextInterface<S> {
  children: React.ReactNode
  state: S
}

/**
 * # createContext<S, C>
 *
 * - Context를 생성하고 사용하는 로직을 경량화(중복코드를 줄이기위한)한 함수
 *
 * ## 코드 예제
 *
 * ```tsx
 * interface StateInterface {}
 * const [context, useContext] = createContext<StateInterface>()
 * ```
 */
export function createContext<S, C = ContextInterface<S>>(): readonly [
  React.FC<C & { children: React.ReactNode }>,
  Consumer<C>
] {
  const context = React.createContext<Nullable<C>>(null)

  const Provider: React.FC<C & { children: React.ReactNode }> = ({ children, ...otherProps }) => {
    return <context.Provider value={otherProps as C}>{children}</context.Provider>
  }

  const useContext: Consumer<C> = () => {
    const _context = React.useContext(context)
    if (!_context) {
      // TODO: 에러 코드 보강 필요
      throw new Error(ErrorMessage.NOT_FOUND_CONTEXT)
    }

    return _context
  }

  return [Provider, useContext]
}
