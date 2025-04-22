import { State, Actions } from './type'

export const initialState: State = {
  fold: false,
  selectedCategory: 'articles',
  mobileSidebarVisible: false,
  loading: true
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
    default:
      return state
  }
}
