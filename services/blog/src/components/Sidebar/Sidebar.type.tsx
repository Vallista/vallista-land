import { SidebarPost } from 'types/type'

export interface SidebarProps {
  posts: SidebarPost[]
  fold: boolean
}

export type ScrollStateType = 'SHOW' | 'HIDE'
export type ViewStateType = 'LIST' | 'CARD'
export type TaggedPosts = Record<string, SidebarPost[]>

export interface ReturnUseSidebar {
  posts: TaggedPosts
  totalPosts: number
  scrollState: ScrollStateType
  viewState: ViewStateType
  search: string
  isNowPage: (target: string) => boolean
  changeScrollState: (scrollHeight?: number, clientHeight?: number) => void
  changeViewState: () => void
  changeSearch: (target: string) => void
  changeLocation: (target: string) => void
}

export type CommonLayoutProps = Pick<SidebarProps, 'fold'> & Pick<ReturnUseSidebar, 'scrollState' | 'viewState'>
