import { useGlobalProvider } from '@/context/useProvider'
import { useSidebarProvider } from '../../Provider/useProvider'
import { NavTop } from '@/../config/navbar'

export const useTitle = () => {
  const { state: globalState } = useGlobalProvider()
  const { state, dispatch } = useSidebarProvider()
  const { view } = state
  const changeViewType = () => {
    dispatch({
      type: 'changeView',
      view: state.view === 'TAG' ? 'LIST' : 'TAG'
    })
  }

  const text = NavTop.find((it) => it.id === globalState.selectedCategory)?.name || ''

  return {
    view,
    text,
    changeViewType
  }
}
