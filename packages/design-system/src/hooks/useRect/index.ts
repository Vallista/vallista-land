import { MutableRefObject, useState } from 'react'
import { useRef } from 'react'
import { useEffect } from 'react'

/**
 * # useRect
 *
 * 화면의 사이즈가 달라질 때, ref로 지정된 요소의 BoundingClientRect를 신규로 반환한다.
 *
 * @example
 * ```tsx
 * const [rect, ref] = useRect<HTMLDivElement>()
 *
 * return (
 *   <div ref={ref} width={rect?.width || 0}>
 *     ...
 *   </div>
 * )
 * ```
 */
export function useRect<T extends Element>(): [DOMRect | undefined, MutableRefObject<T | null>] {
  const ref = useRef<T>(null)
  const [rect, setRect] = useState<DOMRect>()

  const set = (): void => setRect(ref.current?.getBoundingClientRect())

  const useEffectInEvent = (event: 'resize' | 'scroll', useCapture?: boolean): void => {
    useEffect(() => {
      set()
      window.addEventListener(event, set, useCapture)
      return () => window.removeEventListener(event, set, useCapture)
    }, [])
  }

  useEffectInEvent('resize')
  useEffectInEvent('scroll', true)

  return [rect, ref]
}
