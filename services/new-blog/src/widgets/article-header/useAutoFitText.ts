import { useEffect, useLayoutEffect, useRef } from 'react'

interface UseAutoFitTextOptions {
  maxHeight: number
  minFontSize?: number
  maxFontSize?: number
}

/**
 * 텍스트가 컨테이너에 맞게 자동으로 크기 조정하는 훅
 * 컨테이너의 최대 높이를 넘지 않도록 font-size를 동적으로 조정합니다.
 */
export function useAutoFitText(options: UseAutoFitTextOptions) {
  const { maxHeight, minFontSize = 20, maxFontSize = 120 } = options
  const containerRef = useRef<HTMLDivElement>(null)
  const isAdjustingRef = useRef(false)
  const currentFontSizeRef = useRef<number | null>(null)

  // useLayoutEffect로 초기 렌더링 시 즉시 폰트 크기 설정 (레이아웃 시프트 방지)
  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    const textElement = container.querySelector('p') as HTMLElement | null
    if (!textElement) return

    // 이미 조정 중이면 무시
    if (isAdjustingRef.current) return

    isAdjustingRef.current = true

    // setProperty를 사용하여 !important 적용
    const setFontSize = (size: number) => {
      textElement.style.setProperty('font-size', `${size}px`, 'important')
      // lineHeight도 함께 조정하여 일관성 유지
      const lineHeightRatio = 1.2
      textElement.style.setProperty('line-height', `${size * lineHeightRatio}px`, 'important')
    }

    // 이진 탐색을 사용하여 최적의 폰트 크기 찾기 (동기적)
    let low = minFontSize
    let high = maxFontSize
    let optimalSize = minFontSize

    // 이진 탐색으로 최적 크기 찾기 (동기적)
    while (low <= high) {
      const mid = Math.floor((low + high) / 2)

      // 임시로 폰트 크기 설정
      setFontSize(mid)

      // 강제 리플로우를 위해 offsetHeight 읽기
      void container.offsetHeight

      const currentHeight = container.scrollHeight

      if (currentHeight <= maxHeight) {
        // 높이가 허용 범위 내이면 더 큰 크기 시도
        optimalSize = mid
        low = mid + 1
      } else {
        // 높이가 넘치면 더 작은 크기 시도
        high = mid - 1
      }
    }

    // 최종 크기 설정 (3px 작게 적용하여 여유 공간 확보)
    const finalSize = Math.max(minFontSize, optimalSize - 3)
    setFontSize(finalSize)
    currentFontSizeRef.current = finalSize
    isAdjustingRef.current = false
  }, [maxHeight, minFontSize, maxFontSize])

  useEffect(() => {
    const container = containerRef.current

    if (!container) return

    const adjustFontSize = () => {
      // 이미 조정 중이면 무시 (무한 루프 방지)
      if (isAdjustingRef.current) return

      // 컨테이너 내부의 p 태그를 찾기
      const textElement = container.querySelector('p') as HTMLElement | null

      if (!textElement) return

      isAdjustingRef.current = true

      // setProperty를 사용하여 !important 적용
      const setFontSize = (size: number) => {
        textElement.style.setProperty('font-size', `${size}px`, 'important')
        // lineHeight도 함께 조정하여 일관성 유지
        const lineHeightRatio = 1.2
        textElement.style.setProperty('line-height', `${size * lineHeightRatio}px`, 'important')
      }

      // 이진 탐색을 사용하여 최적의 폰트 크기 찾기 (동기적)
      let low = minFontSize
      let high = maxFontSize
      let optimalSize = minFontSize

      // 이진 탐색으로 최적 크기 찾기 (동기적)
      while (low <= high) {
        const mid = Math.floor((low + high) / 2)

        // 임시로 폰트 크기 설정
        setFontSize(mid)

        // 강제 리플로우를 위해 offsetHeight 읽기
        void container.offsetHeight

        const currentHeight = container.scrollHeight

        if (currentHeight <= maxHeight) {
          // 높이가 허용 범위 내이면 더 큰 크기 시도
          optimalSize = mid
          low = mid + 1
        } else {
          // 높이가 넘치면 더 작은 크기 시도
          high = mid - 1
        }
      }

      // 최종 크기 설정 (3px 작게 적용하여 여유 공간 확보)
      const finalSize = Math.max(minFontSize, optimalSize - 3)
      setFontSize(finalSize)
      currentFontSizeRef.current = finalSize
      isAdjustingRef.current = false
    }

    // 디바운싱을 위한 타이머
    let debounceTimer: NodeJS.Timeout | null = null
    const debouncedAdjust = () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        adjustFontSize()
      }, 50)
    }

    // ResizeObserver로 컨테이너 크기 변경 감지
    const resizeObserver = new ResizeObserver(() => {
      debouncedAdjust()
    })
    resizeObserver.observe(container)

    // 텍스트 내용 변경 감지 (attributes는 제외하여 무한 루프 방지)
    const mutationObserver = new MutationObserver((mutations) => {
      // 스타일 변경으로 인한 mutation은 무시
      const hasNonStyleChange = mutations.some((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          return false
        }
        return true
      })

      if (hasNonStyleChange) {
        debouncedAdjust()
      }
    })
    mutationObserver.observe(container, {
      childList: true,
      subtree: true,
      characterData: true
      // attributes는 제외하여 무한 루프 방지
    })

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      resizeObserver.disconnect()
      mutationObserver.disconnect()
    }
  }, [maxHeight, minFontSize, maxFontSize])

  return containerRef
}
