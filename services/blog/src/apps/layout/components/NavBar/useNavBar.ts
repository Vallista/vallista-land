import { useGlobalProvider } from '@/context/useProvider'
import { useNavigate } from 'react-router-dom'

export const useNavBar = () => {
  const navigate = useNavigate()
  const { state, dispatch } = useGlobalProvider()

  const changeCategory = (id: string) => {
    dispatch({
      type: 'changeSelectedCategory',
      category: id
    })

    dispatch({
      type: 'changeMobileSidebarVisible',
      visible: state.selectedCategory !== id ? true : !state.mobileSidebarVisible
    })
  }

  const moveToLocation = (target: string, isNewTab = false) => {
    if (isNewTab) {
      window.open(target, '_blank')
      return
    }

    navigate(target)
  }

  return {
    selectedCategory: state.selectedCategory,
    changeCategory,
    moveToLocation
  }
}
