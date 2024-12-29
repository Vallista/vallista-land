import { useMemo } from 'react'

const uniquePrefix = 'unique-id'
/** 새로운 객체가 생성되면 count 증가시키면서 고유값을 생산 */
let count = 0

/**
 * # useUniqueId
 *
 * 컴포넌트 라이프사이클, 갱신에 상관없이 사용하게되면 고유한 유니크 아이디를 반환합니다.
 *
 * @example
 * ```tsx
 * const uniqueId = useUniqueId()
 * ```
 */
export function useUniqueId(): string {
  const name = useMemo(() => `${uniquePrefix}-${count++}`, [])
  return name
}
