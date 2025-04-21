import { ActionDispatch, createContext, ReactNode, useReducer } from 'react'
import { initialState, reducer } from './reducer'
import { Actions, State } from '../types'

const SidebarContext = createContext<{ state: State; dispatch: ActionDispatch<[action: Actions]> } | null>(null)

interface SidebarProviderProps {
  children: ReactNode
}

const SidebarProvider = ({ children }: SidebarProviderProps) => {
  const [state, dispatch] = useReducer(reducer, initialState)

  return <SidebarContext value={{ state, dispatch }}>{children}</SidebarContext>
}

export { SidebarContext, SidebarProvider }
