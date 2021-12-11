import { renderHook, act } from '@testing-library/react-hooks'

import { useWindowSize } from './index'

describe('useWindowSize 테스트', () => {
  test('window size가 변경될 때 useEffect로 이벤트가 실행되어 값이 변경된 window size 값으로 변경되어야 한다.', () => {
    setWindowSize(200)

    const { result, rerender } = renderHook(() => useWindowSize())

    expect(result.current.width).toEqual(200)
    expect(result.current.height).toEqual(200)

    act(() => {
      setWindowSize(100, 500)
      window.dispatchEvent(new Event('resize'))
      rerender()
    })

    expect(result.current.width).toEqual(100)
    expect(result.current.height).toEqual(500)
  })

  function setWindowSize(size: number): void
  function setWindowSize(width: number, height: number): void
  function setWindowSize(...args: any): void {
    if (args.length === 1) {
      const size = args[0] as number
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: size })
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: size })
    } else {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: args[0] })
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: args[1] })
    }
  }
})
