import { createContext, ReactNode, useReducer, Dispatch } from 'react'
import { Actions, State } from './type'
import { initialState, reducer } from './reducer'

const GlobalContext = createContext<{ state: State; dispatch: Dispatch<Actions> } | null>(null)

interface GlobalProviderProps {
  children: ReactNode
}

const GlobalProvider = ({ children }: GlobalProviderProps) => {
  const [state, dispatch] = useReducer(reducer, initialState)

  return <GlobalContext.Provider value={{ state, dispatch }}>{children}</GlobalContext.Provider>
}

export { GlobalContext, GlobalProvider }
