import { useLocation } from '@reach/router'
import { navigate } from 'gatsby'
import { useMemo, useState } from 'react'
import { SidebarPost } from 'types/type'

import { localStorage } from '../../utils'
import { ReturnUseSidebar, ScrollStateType, SidebarProps, ViewStateType } from './Sidebar.type'

const DEFAULT_SEARCH_VALUE = ''
const DEFAULT_VIEW_STATE: ViewStateType = 'LIST'
const DEFAULT_SCROLL_STATE: ScrollStateType = 'HIDE'

const BLACKLIST: string[] = []

export const useSidebar = <T extends SidebarProps>(props: T): ReturnUseSidebar & Omit<T, 'posts'> => {
  const { posts } = props
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

  // 사용되고 있는 모든 테그를 가져온다.
  const allTags = useMemo(() => {
    return (
      posts
        // 중복되지 않은 태그들만 추출한다.
        .reduce<string[]>((acc, curr) => {
          curr.tags.forEach((it) => {
            const hasTag = acc.find((it_) => it === it_)
            if (!hasTag) acc.push(it)
          })

          return acc
        }, [])
        // 블랙리스트에 있는 내용은 제외한다.
        .filter((it) => !BLACKLIST.includes(it))
        // 오브젝트 형태로 변환한다.
        .reduce<Record<string, SidebarPost[]>>((acc, curr) => {
          acc[curr] = []

          return acc
        }, {})
    )
  }, [])

  // 태그 형태로 변환된 포스트 목록
  const taggedPosts = useMemo(
    () =>
      // 오브젝트 형태로 변환된 태그를 기준으로 포스트를 각 태그에 맞게 넣는다.
      posts.reduce((acc, curr) => {
        curr.tags
          .filter((it) => !BLACKLIST.includes(it))
          .forEach((it) => {
            acc[it].push(curr)
          })
        return acc
      }, allTags),
    [allTags]
  )

  const filteredTaggedPosts = useMemo(() => {
    return Object.entries(taggedPosts).reduce<Record<string, SidebarPost[]>>((acc, curr) => {
      acc[curr[0]] = curr[1].filter((it) => it.name.toLocaleUpperCase().includes(search.toLocaleUpperCase()))

      return acc
    }, {})
  }, [search, taggedPosts])

  return {
    ...props,
    posts: filteredTaggedPosts,
    totalPosts: posts.length,
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
