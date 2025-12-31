import { useEffect, RefObject } from 'react'

/**
 * 특정 요소에서 스크롤 이벤트를 막는 훅
 * 모바일에서 header나 nav 영역에서 스크롤이 발생하지 않도록 함
 */
export function usePreventScroll(elementRef: RefObject<HTMLElement>, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled || !elementRef.current) return

    const element = elementRef.current

    const preventScroll = (e: Event) => {
      e.preventDefault()
      e.stopPropagation()
      return false
    }

    // 휠 이벤트 (마우스 휠)
    const handleWheel = (e: WheelEvent) => {
      if (element.contains(e.target as Node)) {
        preventScroll(e)
      }
    }

    // 터치 이벤트 (모바일)
    const handleTouchMove = (e: TouchEvent) => {
      if (element.contains(e.target as Node)) {
        preventScroll(e)
      }
    }

    // 스크롤 이벤트
    const handleScroll = (e: Event) => {
      if (element.contains(e.target as Node)) {
        preventScroll(e)
      }
    }

    element.addEventListener('wheel', handleWheel, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('scroll', handleScroll, { passive: false })

    return () => {
      element.removeEventListener('wheel', handleWheel)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('scroll', handleScroll)
    }
  }, [enabled, elementRef])
}

