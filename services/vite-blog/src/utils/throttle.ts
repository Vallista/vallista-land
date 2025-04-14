/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/explicit-function-return-type */

/**
 * # throttle
 *
 * 쓰로틀 유틸 함수
 *
 * @param {T} callback 실행시킬 함수
 * @param {number} limit ms
 * 
 * @example
 * ```ts
 * const event = throttle(() => {
    dispThrottle.textContent = ++mouseThrottleCount
}, 500)
    event()
 * ```
 */
export function throttle<T extends (...args: any[]) => Promise<any> | any>(callback: T, limit = 100): T {
  let waiting = false

  return async function (...args: Parameters<T>) {
    if (!waiting) {
      const result = await callback.apply(this, args)
      waiting = true
      setTimeout(() => {
        waiting = false
      }, limit)

      return result
    }
  } as T
}
