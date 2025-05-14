import { lazy, Suspense, useState } from 'react'
import { ToastContextState, ToastProps, ToastState, ToastType } from './type'
import { createContext } from '../../utils/createContext'

const [Context, useContext] = createContext<ToastContextState>()
export const useToastContext = () => useContext()

let toastUniqueCount = 0

interface ToastProviderProps {
  children: React.ReactNode
}

/**
 * # ToastProvider
 *
 * 실제로 사용되지 않습니다.
 * 이 Provider는 ThemeProvider에 적용되어 있습니다.
 * 별도로 사용하지 마시고, ThemeProvider를 사용해서 함께 사용하세요.
 */
export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [state, setState] = useState<ToastState>({
    toastList: []
  })

  const ToastRoot = lazy(() => import('./ToastRoot'))

  return (
    <Context
      state={{
        toastList: state.toastList,
        message,
        success,
        error,
        remove
      }}
    >
      {children}
      <Suspense fallback={null}>{typeof window !== 'undefined' && <ToastRoot />}</Suspense>
    </Context>
  )

  function message(param: string | ToastProps): void {
    call(param, 'primary')
  }

  function success(param: string | ToastProps): void {
    call(param, 'success')
  }

  function error(param: string | ToastProps): void {
    call(param, 'error')
  }

  function call(param: string | ToastProps, type: ToastType): void {
    if (typeof param === 'string') {
      setState((state_) => ({
        ...state_,
        toastList: [...state_.toastList, { text: param, toastUniqueCount: toastUniqueCount++, type }]
      }))
    } else {
      setState((state_) => ({
        ...state_,
        toastList: [...state_.toastList, { ...param, toastUniqueCount: toastUniqueCount++, type }]
      }))
    }
  }

  function remove(uniqueId: number): void {
    setState((state_) => {
      return {
        ...state_,
        toastList: state_.toastList.filter((it) => it.toastUniqueCount !== uniqueId)
      }
    })
  }
}
