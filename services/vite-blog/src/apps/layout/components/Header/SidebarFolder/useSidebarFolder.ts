import { useGlobalProvider } from '@/context/useProvider'

export const useSidebarFolder = () => {
  const { state, dispatch } = useGlobalProvider()

  return {
    fold: state.fold,
    changeFold: () => dispatch({ type: 'changeFold', fold: !state.fold })
  }
}
