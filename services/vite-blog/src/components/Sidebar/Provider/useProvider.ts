import { use } from 'react'
import { SidebarContext } from '.'

export const useSidebarProvider = () => {
  const context = use(SidebarContext)

  if (!context) {
    throw new Error('useProvider must be used within a SidebarProvider')
  }

  const { state, dispatch } = context

  return {
    state,
    dispatch
  }
}
