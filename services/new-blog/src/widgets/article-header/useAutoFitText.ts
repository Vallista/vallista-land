import { useEffect, useRef } from 'react'

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

  useEffect(() => {
    const container = containerRef.current

    if (!container) return

    const adjustFontSize = () => {
      // 컨테이너 내부의 p 태그를 찾기
      const textElement = container.querySelector('p') as HTMLElement | null

      if (!textElement) return

      // 초기 크기에서 시작 (maxFontSize부터 줄여가며 시도)
      let fontSize = maxFontSize
      textElement.style.fontSize = `${fontSize}px !important`

      // 컨테이너 높이가 maxHeight를 넘지 않을 때까지 font-size 줄이기
      while (container.scrollHeight > maxHeight && fontSize > minFontSize) {
        fontSize -= 1
        textElement.style.fontSize = `${fontSize}px !important`
      }

      // 최소 크기보다 작아지면 최소 크기로 고정
      if (fontSize < minFontSize) {
        textElement.style.fontSize = `${minFontSize}px !important`
      }
    }

    // 초기 조정 (약간의 지연을 두어 DOM 렌더링 완료 후 실행)
    const timeoutId = setTimeout(adjustFontSize, 0)

    // ResizeObserver로 컨테이너 크기 변경 감지
    const resizeObserver = new ResizeObserver(adjustFontSize)
    resizeObserver.observe(container)

    // 텍스트 내용 변경 감지
    const mutationObserver = new MutationObserver(adjustFontSize)
    mutationObserver.observe(container, {
      childList: true,
      subtree: true,
      characterData: true
    })

    return () => {
      clearTimeout(timeoutId)
      resizeObserver.disconnect()
      mutationObserver.disconnect()
    }
  }, [maxHeight, minFontSize, maxFontSize])

  return containerRef
}
