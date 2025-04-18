import { Actions, State } from '../types'

export const initialState: State = {
  view: 'LIST',
  search: ''
}

export const reducer = (state: State, action: Actions): State => {
  switch (action.type) {
    case 'changeView':
      return {
        ...state,
        view: action.view
      }
    case 'changeSearch':
      return {
        ...state,
        search: action.search
      }
    default:
      return state
  }
}
