import { createContext, useContext, useState, ReactNode, useEffect } from 'react'

import { useWindowSize } from '../hooks'

interface SidebarContextType {
  isOpen: boolean
  isVisible: boolean
  toggle: () => void
  close: () => void
  open: () => void
  visible: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(true)
  const [isVisible, setIsVisible] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  const { width } = useWindowSize()

  useEffect(() => {
    setIsMobile(width < 1025)
  }, [width])

  useEffect(() => {
    if (!isMobile) {
      setIsVisible(true)
    }
  }, [isMobile])

  // 모바일에서 사이드바가 열려있을 때 body 스크롤 방지
  useEffect(() => {
    if (!isMobile) return

    if (isVisible) {
      // 사이드바가 열려있을 때 body 스크롤 막기
      const originalOverflow = document.body.style.overflow
      const originalPosition = document.body.style.position
      const scrollY = window.scrollY

      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
      document.body.style.top = `-${scrollY}px`

      return () => {
        // 사이드바가 닫힐 때 원래 상태로 복원
        document.body.style.overflow = originalOverflow
        document.body.style.position = originalPosition
        document.body.style.width = ''
        document.body.style.top = ''
        window.scrollTo(0, scrollY)
      }
    }
  }, [isMobile, isVisible])

  const toggle = () => setIsOpen(!isOpen)
  const close = () => setIsOpen(false)
  const open = () => setIsOpen(true)
  const visible = () => setIsVisible(!isVisible)

  return (
    <SidebarContext.Provider value={{ isOpen, isVisible, toggle, close, open, visible }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}
