import { useSidebarProvider } from '../../Provider/useProvider'

export const useSearch = () => {
  const { state, dispatch } = useSidebarProvider()

  return {
    search: state.search,
    setSearch: (search: string) => {
      dispatch({
        type: 'changeSearch',
        search
      })
    }
  }
}
