/* eslint-disable react-refresh/only-export-components */
import { useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom'

import { Toast } from './Toast'
import { ReturningUseToasts } from './type'
import { useToastContext } from './ToastProvider'
import { toastRootLayer, toastItem, toastStackLimit } from './ToastRoot.css'
import { clsx } from 'clsx'

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
  const context = useToastContext()

  return {
    message: context.message,
    success: context.success,
    error: context.error
  }
}

// SSR 안전한 Portal 생성
const createPortal = (children: React.ReactNode, container: Element) => {
  if (typeof window === 'undefined') return null
  try {
    return ReactDOM.createPortal(children, container)
  } catch {
    // Portal 생성 실패 시 null 반환
    return null
  }
}

export default function ToastRoot() {
  const context = useToastContext()
  const ref = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState(false)
  const [mounted, setMounted] = useState(false)

  // SSR 안전한 마운트
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return

    const mouseEnter = (): void => {
      setHover(true)
    }

    const mouseOut = (): void => {
      setHover(false)
    }

    const node = ref.current
    if (!node) return

    node.addEventListener('mouseenter', mouseEnter)
    node.addEventListener('mouseleave', mouseOut)

    return () => {
      node.removeEventListener('mouseenter', mouseEnter)
      node.removeEventListener('mouseleave', mouseOut)
    }
  }, [mounted])

  useEffect(() => {
    if (context.toastList.length === 0) {
      setHover(false)
    }
  }, [context.toastList])

  // SSR에서는 아무것도 렌더링하지 않음
  if (!mounted || typeof document === 'undefined') return null

  // 안전한 Portal 생성
  const portal = createPortal(
    <div ref={ref} className={toastRootLayer}>
      {context.toastList.map((it, idx, arr) => (
        <div key={it.toastUniqueCount} className={clsx(toastItem, idx >= 3 && toastStackLimit)}>
          <Toast
            hover={hover}
            {...it}
            order={arr.length - 1 - idx}
            remove={() => context.remove(it.toastUniqueCount)}
          />
        </div>
      ))}
    </div>,
    document.body
  )

  return portal
}
