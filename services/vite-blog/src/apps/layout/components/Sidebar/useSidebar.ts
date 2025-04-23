import { useGlobalProvider } from '@/context/useProvider'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useScrollTo } from '@/hooks/useScrollTo'
import { useEffect } from 'react'

export const useSidebar = () => {
  const { state, dispatch } = useGlobalProvider()
  const { scrollTo } = useScrollTo()
  const isDesktop = useMediaQuery('(min-width: 1025px)')

  const openMobileSidebar = () => {
    const scrollY = window.scrollY
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.zIndex = '0'
    document.body.style.width = '100%'
    document.body.style.height = '100%'
    document.getElementsByTagName('main')[0].style.top = `-${scrollY}px`
    dispatch({
      type: 'changeScrollY',
      scrollY
    })
  }

  const closeMobileSidebar = () => {
    document.body.style.overflow = ''
    document.body.style.position = ''
    document.body.style.top = ''
    document.body.style.width = ''
    document.body.style.height = ''
    document.getElementsByTagName('main')[0].style.top = '0'
    if (state.scrollY !== 0) scrollTo(state.scrollY, false)
  }

  useEffect(() => {
    if (state.mobileSidebarVisible) openMobileSidebar()
    else closeMobileSidebar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.mobileSidebarVisible])

  useEffect(() => {
    if (!isDesktop) return

    // 데스크탑 모드인데 사이드바가 켜져있으면
    if (state.mobileSidebarVisible) closeMobileSidebar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDesktop])

  return {
    fold: state.fold,
    visible: state.mobileSidebarVisible
  }
}
