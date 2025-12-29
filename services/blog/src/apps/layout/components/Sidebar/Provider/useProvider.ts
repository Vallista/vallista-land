import { use } from 'react'
import { SidebarContext } from './index'

export const useSidebarProvider = () => {
  const context = use(SidebarContext)
  if (!context) {
    throw new Error('useSidebarProvider must be used within a SidebarProvider')
  }
  return context
}
