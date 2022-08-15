import { useLocation } from '@reach/router'
import { navigate } from 'gatsby'
import { useState } from 'react'

import { localStorage } from '../../utils'
import { ReturnUseSidebar, ScrollStateType, SidebarProps, ViewStateType } from './Sidebar.type'

const DEFAULT_SEARCH_VALUE = ''
const DEFAULT_VIEW_STATE: ViewStateType = 'LIST'
const DEFAULT_SCROLL_STATE: ScrollStateType = 'HIDE'

export const useSidebar = <T extends SidebarProps>(props: T): ReturnUseSidebar & T => {
  const location = useLocation()

  const [search, setSearch] = useState(() => {
    return localStorage.get('search') || DEFAULT_SEARCH_VALUE
  })

  const [viewState, setViewState] = useState<ViewStateType>(() => {
    const viewType = localStorage.get('view-type') as string

    if (viewType === 'list' || viewType === 'card') {
      localStorage.set('view-type', viewType.toUpperCase())
    }

    return (localStorage.get('view-type') as ViewStateType) || DEFAULT_VIEW_STATE
  })

  const [scrollState, setScrollState] = useState<ScrollStateType>(DEFAULT_SCROLL_STATE)

  return {
    ...props,
    scrollState,
    viewState,
    search,
    isNowPage,
    changeScrollState,
    changeViewState,
    changeSearch,
    changeLocation
  }

  function isNowPage(target: string): boolean {
    return decodeURIComponent(location.pathname).includes(target.slice(0, -1))
  }

  function changeScrollState(scrollHeight = 0, clientHeight = 0): void {
    setScrollState(scrollHeight > clientHeight ? 'SHOW' : 'HIDE')
  }

  function changeViewState(): void {
    const type = viewState === 'CARD' ? 'LIST' : 'CARD'
    localStorage.set('view-type', type)
    setViewState(type)
  }

  function changeSearch(target: string): void {
    setSearch(target)
    localStorage.set('search', '')
  }

  function changeLocation(target: string): void {
    navigate(target)
  }
}
