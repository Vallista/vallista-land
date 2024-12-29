/**
 * # copy
 *
 * clipboard에 copy를 하는 함수입니다.
 *
 * @param {string} text 복사할 텍스트
 * @param success 성공 시 실행할 함수
 * @param failure 실패 시 실행할 함수
 *
 * @example ```tsx
 * copy('hello world')
 * ```
 */
export function copy(text: string, success?: () => void, failure?: () => void): void {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      success?.()
    })
    .catch(() => {
      failure?.()
    })
}
