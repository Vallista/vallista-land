import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { ScrollStateType, SidebarContent } from '../types'
import { DEFAULT_SCROLL_STATE } from '../utils'
import { useSidebarProvider } from '../Provider/useProvider'
import { useGlobalProvider } from '@/context/useProvider'

interface UseContentsProps {
  count: number
  contents: SidebarContent[]
}

export const useContents = (props: UseContentsProps) => {
  const { contents, count } = props
  const ref = useRef<HTMLDivElement>(null)

  const [scrollState, setScrollState] = useState<ScrollStateType>(DEFAULT_SCROLL_STATE)
  const { state } = useSidebarProvider()
  const { dispatch } = useGlobalProvider()

  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (ref.current === null) return
    const { scrollHeight, clientHeight } = ref.current
    setScrollState(scrollHeight > clientHeight ? 'SHOW' : 'HIDE')
  }, [state.search, state.view])

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const preventScrollChaining = (e: TouchEvent) => {
      const scrollTop = el.scrollTop
      const scrollHeight = el.scrollHeight
      const offsetHeight = el.offsetHeight
      const atTop = scrollTop === 0
      const atBottom = scrollTop + offsetHeight >= scrollHeight

      const touchY = e.touches[0].clientY
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const deltaY = touchY - (preventScrollChaining as any)._lastY || 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(preventScrollChaining as any)._lastY = touchY

      if ((atTop && deltaY > 0) || (atBottom && deltaY < 0)) {
        e.preventDefault()
      }
    }

    el.addEventListener('touchstart', (e) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(preventScrollChaining as any)._lastY = e.touches[0].clientY
    })
    el.addEventListener('touchmove', preventScrollChaining, { passive: false })

    return () => {
      el.removeEventListener('touchmove', preventScrollChaining)
    }
  }, [])

  // MEMO: 사용되고 있는 모든 테그를 가져온다.
  const tags = Array.from(
    contents.reduce((acc, curr) => {
      if (!curr.tags || curr.tags.length === 0) return acc

      curr.tags.forEach((tag) => {
        if (acc.has(tag)) return
        acc.add(tag)
      })

      return acc
    }, new Set())
  )

  // MEMO: 태그 단위로 포스트를 나누기 위해 오브젝트 형태로 변환한다.
  const taggedContents = contents.reduce(
    (acc, curr) => {
      if (!curr.tags || curr.tags.length === 0) return acc

      curr.tags.forEach((tag) => {
        if (!acc[tag]) acc[tag] = []

        acc[tag].push(curr)
      })
      return acc
    },
    {} as Record<string, SidebarContent[]>
  )

  const isNowPage = (target: string) => {
    return decodeURIComponent(location.pathname).includes(target.slice(0, -1))
  }

  const moveToLocation = (target: string) => {
    navigate(target)
    dispatch({
      type: 'changeMobileSidebarVisible',
      visible: false
    })
    dispatch({
      type: 'changeScrollY',
      scrollY: 0
    })
  }

  return {
    count,
    contents,
    view: state.view,
    ref,
    tags,
    taggedContents,
    scrollState,
    isNowPage,
    moveToLocation
  }
}
