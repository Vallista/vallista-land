/**
 * 특정한 소숫점 자리를 올립니다.
 *
 * @param {number} target 소숫점 절삭할 타겟
 */
export function raiseDecimalPoint(target: number): number {
  return Math.ceil(target * 10000) / 10000
}
