export interface State {
  /** 접었는가 알 수 있는 상태 */
  fold: boolean
}

export type Actions = {
  type: 'changeFold'
  fold: boolean
}
