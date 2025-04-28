import { use } from 'react'
import { GlobalContext } from '.'

export const useGlobalProvider = () => {
  const context = use(GlobalContext)

  if (!context) {
    throw new Error('useProvider must be used within a SidebarProvider')
  }

  const { state, dispatch } = context

  return {
    state,
    dispatch
  }
}
