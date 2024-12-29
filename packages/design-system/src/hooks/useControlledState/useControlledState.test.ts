import { renderHook, act } from '@testing-library/react-hooks'
import { useState } from 'react'

import { useControlledState } from './'

describe('useControlledState 테스트', () => {
  test('onChange를 이용해, value를 변경한다.', () => {
    const initialValue = 0
    const { result } = renderHook(() => useControlledState(initialValue))

    const [, onChange] = result.current
    act(() => {
      onChange(10)
    })

    expect(result.current[0]).toBe(10)
  })

  test('아무런 parameter를 넣지 않아도 상태가 생성되어 동작되어야 한다', () => {
    const { result } = renderHook(() => useControlledState())

    const [, onChange] = result.current
    act(() => {
      onChange('hihihi')
    })

    expect(result.current[0]).toBe('hihihi')
  })

  test('defaultValue만 넣었을 때, defaultValue로 기본값이 보이고, 값이 이후에 변경되어야 한다', () => {
    const { result } = renderHook(() => useControlledState('Hello', undefined))

    expect(result.current[0]).toBe('Hello')

    const [, onChange] = result.current
    act(() => {
      onChange('world')
    })

    expect(result.current[0]).toBe('world')
  })

  test('value가 있다면 defaultValue를 무시한다.', () => {
    const { result } = renderHook(() => useControlledState(10, 1))

    expect(result.current[0]).toBe(10)
  })

  test('value와 onChange를 useState를 사용하여 값을 넣었을 때 useState의 값은 onChange의 행동에 따라 변화한다.', () => {
    const { result: initialState, rerender } = renderHook(() => useState('A'))
    const { result: controlledState } = renderHook(() =>
      useControlledState('A', initialState.current[0], initialState.current[1])
    )

    const [, onChange] = controlledState.current

    act(() => {
      onChange('B')
      rerender()
    })

    expect(initialState.current[0]).toBe('B')
  })

  test('onChange를 등록하지 않았으나, 원본 값이 변경되는 경우, 변경된 값으로 갱신한다.', () => {
    const { result: initialState } = renderHook(() => useState('A'))
    const { result: controlledState, rerender } = renderHook(() =>
      useControlledState(initialState.current[0], initialState.current[0])
    )

    const [, onChange] = initialState.current
    act(() => {
      onChange('B')
      rerender()
    })

    expect(controlledState.current[0]).toBe('B')
  })
})
