import { State, Actions } from './type'

export const initialState: State = {
  fold: false,
  selectedCategory: 'articles',
  mobileSidebarVisible: false,
  loading: true,
  scrollY: 0
}

export const reducer = (state: State, action: Actions): State => {
  switch (action.type) {
    case 'changeFold':
      return {
        ...state,
        fold: action.fold
      }
    case 'changeSelectedCategory':
      return {
        ...state,
        selectedCategory: action.category
      }
    case 'changeMobileSidebarVisible':
      return {
        ...state,
        mobileSidebarVisible: action.visible
      }
    case 'changeLoading':
      return {
        ...state,
        loading: action.loading
      }
    case 'changeScrollY':
      return {
        ...state,
        scrollY: action.scrollY
      }
    default:
      return state
  }
}
