import { renderHook, act } from '@testing-library/react-hooks'

import { useUniqueId } from './'

describe('useUniqueId 테스트', () => {
  test('렌더링이 되어도 값이 고유히 남아있어야 한다.', () => {
    const { result, rerender } = renderHook(() => useUniqueId())

    const value = result.current

    act(() => {
      rerender()
    })

    expect(result.current).toBe(value)
  })

  test('여러개를 만들어도 기존 번호가 유지되어야 한다.', () => {
    const { result: firstId, rerender: firstRerender } = renderHook(() => useUniqueId())
    const { result: secondId } = renderHook(() => useUniqueId())

    const value = firstId.current
    const value2 = secondId.current
    expect(firstId.current).toBe(value)
    expect(secondId.current).toBe(value2)

    act(() => {
      firstRerender()
    })

    expect(firstId.current).toBe(value)
    expect(secondId.current).toBe(value2)
  })
})
