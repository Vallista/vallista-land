import { use } from 'react'
import { GlobalContext } from './index'

export const useGlobalProvider = () => {
  const context = use(GlobalContext)
  if (!context) {
    throw new Error('useGlobalProvider must be used within a GlobalProvider')
  }
  return context
}
