export type ViewType = 'TAG' | 'LIST'
export type ScrollStateType = 'SHOW' | 'HIDE'

export interface State {
  /** 뷰 타입 */
  view: ViewType
  /** 검색 텍트 */
  search: string
}

export type Actions =
  | {
      type: 'changeView'
      view: ViewType
    }
  | {
      type: 'changeSearch'
      search: string
    }

export interface SidebarContent {
  name: string
  slug: string
  tags: string[]
  url: string
}
