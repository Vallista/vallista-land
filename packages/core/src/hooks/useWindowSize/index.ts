import { useState, useEffect } from 'react'

interface WindowSize {
  width: number | undefined
  height: number | undefined
}

/**
 * # useWindowSize
 *
 * 사이즈가 변경되어 갱신된 윈도우 사이즈를 반환한다.
 *
 * @returns {@link WindowSize}
 *
 * @example
 *
 * ```tsx
 * const windowSize = useWindowSize()
 * windowSize.width // usage
 * windowSize.height // usage
 * ```
 */
export function useWindowSize(): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: undefined,
    height: undefined
  })
  useEffect(() => {
    function handleResize(): void {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }
    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  return windowSize
}
