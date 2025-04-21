export interface State {
  /** 접었는가 알 수 있는 상태 */
  fold: boolean
  /** 1차 카테고리 (Nav) 무엇을 선택했는가? */
  selectedCategory: string
  /** mobile에서 sidebar가 보이는 상태 */
  mobileSidebarVisible: boolean
}

export type Actions =
  | {
      type: 'changeFold'
      fold: boolean
    }
  | {
      type: 'changeSelectedCategory'
      category: string
    }
  | {
      type: 'changeMobileSidebarVisible'
      visible: boolean
    }
