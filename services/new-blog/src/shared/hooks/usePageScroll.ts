import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

interface UsePageScrollOptions {
  enabled?: boolean
  dependencies?: unknown[]
}

/**
 * 페이지 상단으로 스크롤하는 훅
 * 페이지 변경 시 자동으로 스크롤을 맨 위로 이동시킵니다.
 * CSR 환경에서도 확실하게 동작하도록 여러 타이밍에서 스크롤을 보장합니다.
 * 캐싱된 페이지가 다시 렌더링될 때도 스크롤을 초기화합니다.
 */
export function usePageScroll(options: UsePageScrollOptions = {}) {
  const { enabled = true, dependencies = [] } = options
  const location = useLocation()
  const previousLocationRef = useRef<string>('')

  const scrollToTop = () => {
    // behavior: 'instant'가 지원되지 않는 브라우저를 위해 fallback 제공
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    } catch {
      window.scrollTo(0, 0)
    }
  }

  // 경로가 변경될 때마다 페이지 상단으로 스크롤
  useEffect(() => {
    if (!enabled) return

    const currentLocation = `${location.pathname}-${location.key}`
    const hasLocationChanged = previousLocationRef.current !== currentLocation

    // 위치가 변경되었거나 처음 마운트될 때 스크롤 초기화
    if (hasLocationChanged || previousLocationRef.current === '') {
      previousLocationRef.current = currentLocation

      // 즉시 스크롤
      scrollToTop()

      // DOM 업데이트 후에도 스크롤 위치를 확인
      // requestAnimationFrame으로 브라우저 렌더링 사이클에 맞춤
      const rafId = requestAnimationFrame(() => {
        scrollToTop()

        // CSR 렌더링이 완료된 후에도 한 번 더 확인
        setTimeout(() => {
          scrollToTop()
        }, 0)

        // 추가 지연을 두어 모든 렌더링이 완료된 후에도 확인
        setTimeout(() => {
          scrollToTop()
        }, 100)
      })

      return () => cancelAnimationFrame(rafId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.key, enabled, ...dependencies])

  // 추가 dependencies가 있을 때 스크롤 초기화
  useEffect(() => {
    if (!enabled || dependencies.length === 0) return
    scrollToTop()
    requestAnimationFrame(() => {
      scrollToTop()
      setTimeout(scrollToTop, 0)
      setTimeout(scrollToTop, 100)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies)

  // 컴포넌트가 마운트될 때마다 스크롤 위치 확인 (캐싱된 페이지 재렌더링 대응)
  useEffect(() => {
    if (!enabled) return

    // 마운트 시 스크롤 위치 확인 및 조정
    const checkAndScroll = () => {
      if (window.scrollY > 0) {
        scrollToTop()
      }
    }

    // 여러 타이밍에서 확인
    requestAnimationFrame(() => {
      checkAndScroll()
      setTimeout(checkAndScroll, 0)
      setTimeout(checkAndScroll, 100)
    })
  }, [enabled])
}
