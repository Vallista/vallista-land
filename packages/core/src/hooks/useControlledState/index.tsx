import { useState, useRef, useCallback } from 'react'

/**
 * # useControlledState
 *
 * 상태를 쉽게 제어해주는 커스텀 훅
 *
 * ## 사용목적
 *
 * 1. 이전 상태와 현재 상태가 값이 동일한 경우, 렌더링에 영향을 주지 않도록 상태를 갱신하지 않음
 * 2. 기본 값 처리등의 귀찮은 작업 한번에 처리
 *
 * ## 사용하는 경우
 *
 * 1. value가 변하므로써, 컨트롤하고 있는 상태가 변경되어야 할 때
 * 2. 렌더링 최적화가 진행되어야 할 때
 * 3. 대다수의 경우에 사용.
 *
 * @param value 갱신할 값 (렌더링에 영향을 주는 변수)
 * @param onChange 값을 컨트롤하는 함수
 *
 * @example
 * ```tsx
 * const [state, setState] = useControlledState()
 * ```
 */
export function useControlledState<T>(
  value?: T,
  defaultValue?: T,
  onChange?: (value: T) => void
): [T | undefined, (value: T) => void] {
  const [stateValue, setStateValue] = useState(typeof value !== 'undefined' ? value : defaultValue)

  /** 과거 처음 들어온 original 상태가 어떤 상태인지 체크 */
  const ref = useRef(value)
  const stateRef = useRef(stateValue)
  /**
   * onChange 여부를 체크하지 않고 값이 있었는지 없었는지만 체크
   * 만약 value가 있었다면, 제어하고 있었던 것으로 취급.
   */
  // const wasControlled = ref.current
  /** value와 onChange등의 값이 전부 들어오면 controlled state이다. */
  const isControlled = value !== undefined && onChange !== undefined
  const isChangedOriginalValue = ref.current !== value

  /**
   * controlled state 였던 것..
   * 두 값이 다르다면 지금 props로 받은 value, onChange가 값이 없었다가 생겼다거나,
   * 그 반대인 값이 있었다가 없어졌다거나..
   *
   * 이러한 경우 예외적인 처리를 해주어야 함
   * 왜냐하면, onChange가 갑자기 없어진다고 생각해보면 갑자기 사용자 단위에서
   * 행동이 안될 것이기 때문.
   * */
  // if (wasControlled !== isControlled) {
  // TODO: 지금은 필요 없음
  // 다른 처리 해주긴 해야함. 하지만 현재 컴포넌트 체계상 이런 부분이 없을 것
  // }

  /** 갱신하고 현재 상태로 다음 틱에서 wasControlled를 전달하기 위해, 값 덮어쓰기 */
  // ref.current = isControlled

  /** original 값이 변경되었을때 감지해서 값을 변경시키고 virtual dom을 갱신한다. */
  if (isChangedOriginalValue) {
    ref.current = value
    setTimeout(() => setStateValue(ref.current))
  }

  const setState = useCallback(
    (_value: T): void => {
      /**
       * 제어하고 있는 상황의 경우에는 onChange 함수를 받음
       * 이 경우 이전 값과 현재 값이 다르지 않나 체크를 진행해서
       * 동일하면 상태 변경 안함 = 렌더링 최적화
       * */
      const onChangeCaller = (__value: T): void => {
        if (onChange) {
          if (stateRef.current !== __value) onChange(__value)
        }
      }
      if (!isControlled) setStateValue(_value)
      onChangeCaller(_value)
    },
    [isControlled, value]
  )

  // 제어하고 있으면 이전 값에 최신 값 덮어 씌움

  if (isControlled) stateRef.current = value
  // 비제어인 경우, 이번 값이 없을수도 있으니, 이전 값으로 덮어씌우기
  // 만약 original 값이 변경되었으면 변경된 값으로 수정
  else value = isChangedOriginalValue ? ref.current : stateValue

  return [value, setState]
}
