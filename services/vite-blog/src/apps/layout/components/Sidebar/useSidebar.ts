import { useGlobalProvider } from '@/context/useProvider'
import { useEffect } from 'react'

export const useSidebar = () => {
  const { state } = useGlobalProvider()

  useEffect(() => {
    if (state.mobileSidebarVisible) {
      const scrollY = window.scrollY
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.zIndex = '0'
      document.body.style.width = '100%'
      document.body.style.height = '100%'
      document.getElementsByTagName('main')[0].style.top = `-${scrollY}px`
    } else {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.height = ''
      document.getElementsByTagName('main')[0].style.top = '0'
    }
  }, [state.mobileSidebarVisible])

  return {
    fold: state.fold,
    visible: state.mobileSidebarVisible
  }
}
