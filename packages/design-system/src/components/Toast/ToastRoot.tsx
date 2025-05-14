import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom'

import { Toast } from './Toast'
import { ReturningUseToasts } from './type'
import { useToastContext } from './ToastProvider'

/**
 * # useToasts
 *
 * 실제 토스트를 사용하는 훅
 * 모든 컴포넌트 필요없이, 토스트 컴포넌트로 호출만 하면 됩니다.
 * 다만 상단에 ThemeProvider가 필수적으로 존재해야 합니다.
 *
 * @example ```tsx
 * toast.message('링크를 복사했습니다.')
 * toast.success({ text: '링크를 복사했습니다.',})
 * toast.error({ text: '링크를 복사했습니다.',})
 * ```
 */
export function useToasts(): Omit<ReturningUseToasts, 'toastList'> {
  const { state } = useToastContext()

  return {
    message: state.message,
    success: state.success,
    error: state.error
  }
}

export default function ToastRoot() {
  const { state } = useToastContext()
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

  useEffect(() => {
    if (state.toastList.length === 0) {
      setHover(false)
    }
  }, [state.toastList])

  if (typeof document === 'undefined') return <></>

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
    document.body
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
