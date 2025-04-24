import { useGlobalProvider } from '@/context/useProvider'

export const useSidebar = () => {
  const { state } = useGlobalProvider()

  return {
    fold: state.fold,
    visible: state.mobileSidebarVisible
  }
}
