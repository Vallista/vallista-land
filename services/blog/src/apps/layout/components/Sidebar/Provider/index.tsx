import { createContext, ReactNode, useReducer, Dispatch } from 'react'
import { initialState, reducer } from './reducer'
import { Actions, State } from '../types'

const SidebarContext = createContext<{ state: State; dispatch: Dispatch<Actions> } | null>(null)

interface SidebarProviderProps {
  children: ReactNode
}

export const SidebarProvider = ({ children }: SidebarProviderProps) => {
  const [state, dispatch] = useReducer(reducer, initialState)

  return <SidebarContext.Provider value={{ state, dispatch }}>{children}</SidebarContext.Provider>
}

export { SidebarContext }
