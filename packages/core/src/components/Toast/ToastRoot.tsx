import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { FC, useEffect, useRef, useState, VFC } from 'react'
import ReactDOM from 'react-dom'

import { createContext } from '../../utils/createContext'
import { Toast } from './Toast'
import { ReturningUseToasts, ToastContextState, ToastProps, ToastState, ToastType } from './type'

const [Context, useContext] = createContext<ToastContextState>()

export function useToasts(): Omit<ReturningUseToasts, 'toastList'> {
  const { state } = useContext()

  return {
    message: state.message,
    success: state.success,
    error: state.error
  }
}

let toastUniqueCount = 0

export const ToastProvider: FC = ({ children }) => {
  const [state, setState] = useState<ToastState>({
    toastList: []
  })

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
      <ToastRoot />
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

const ToastRoot: VFC = () => {
  const { state } = useContext()
  const ref = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState(false)

  useEffect(() => {
    const mouseEnter = (): void => {
      setHover(true)
    }

    const mouseOut = (): void => {
      setHover(false)
    }

    ref.current?.addEventListener('mouseenter', mouseEnter)
    ref.current?.addEventListener('mouseleave', mouseOut)

    return () => {
      ref.current?.removeEventListener('mouseenter', mouseEnter)
      ref.current?.removeEventListener('mouseleave', mouseOut)
    }
  }, [])

  return ReactDOM.createPortal(
    <ToastRootLayer ref={ref}>
      {state.toastList.map((it, idx, arr) => (
        <Toast
          hover={hover}
          {...it}
          order={arr.length - 1 - idx}
          key={it.toastUniqueCount}
          remove={() => state.remove(it.toastUniqueCount)}
        />
      ))}
    </ToastRootLayer>,
    document.getElementById('modal-root') ?? document.body
  )
}

const ToastRootLayer = styled.div`
  position: fixed;
  right: 1.5rem;
  bottom: 1.5rem;
  max-width: 420px;
  transition: all 0.4s ease;

  ${({ theme }) => css`
    z-index: ${theme.layers.SNACKBAR};
  `}

  @media (max-width: 440px) {
    max-width: 90vw;
    right: 5vw;
  }

  & > div:not(:first-of-type)::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: calc(100% + 1px);
    width: 100%;
    height: 20px;
    background: transparent;
  }

  & > div:nth-last-of-type(n + 4) {
    opacity: 0 !important;
    pointer-events: none;
  }

  &:hover {
    transform: translate3d(0, -10px, 0);
  }
`
