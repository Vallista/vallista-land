import { createContext } from '../../utils/createContext'
import { RadioContextStateWithProps } from './type'

const [context, useContext] = createContext<RadioContextStateWithProps>()

export const RadioContext = context
export const useRadioContext = useContext
