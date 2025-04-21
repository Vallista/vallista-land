import { useGlobalProvider } from '@/context/useProvider'
import { useNavigate } from 'react-router'

export const useNavBar = () => {
  const navigate = useNavigate()
  const { state, dispatch } = useGlobalProvider()

  const changeCategory = (id: string) => {
    dispatch({
      type: 'changeSelectedCategory',
      category: id
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
