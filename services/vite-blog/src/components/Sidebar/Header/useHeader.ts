import { useGlobalProvider } from '@/context/useProvider'
import { useSidebarProvider } from '../Provider/useProvider'

export const useHeader = () => {
  const { state, dispatch } = useSidebarProvider()
  const { state: globalState, dispatch: globalDispatch } = useGlobalProvider()

  return {
    view: state.view,
    search: state.search,
    fold: globalState.fold,
    changeViewType: () => {
      dispatch({
        type: 'changeView',
        view: state.view === 'TAG' ? 'LIST' : 'TAG'
      })
    },
    setFold: (fold: boolean) => {
      globalDispatch({
        type: 'changeFold',
        fold
      })
    },
    setSearch: (search: string) => {
      dispatch({
        type: 'changeSearch',
        search
      })
    }
  }
}
