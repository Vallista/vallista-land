import { State, Actions } from './type'

export const initialState: State = {
  fold: false
}

export const reducer = (state: State, action: Actions): State => {
  switch (action.type) {
    case 'changeFold':
      return {
        ...state,
        fold: action.fold
      }
    default:
      return state
  }
}
