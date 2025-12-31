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
