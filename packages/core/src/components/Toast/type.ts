export type ToastType = 'primary' | 'success' | 'error'

export interface ToastProps {
  text: string
}

export interface ToastElementProps extends ToastProps {
  type: ToastType
  order: number
  hover: boolean
  remove: () => void
}

export interface ToastItem extends ToastProps {
  toastUniqueCount: number
  type: ToastType
}

export interface ToastState {
  toastList: ToastItem[]
}

export type ToastFuncType = (params: string | ToastProps) => void

export interface ToastContextState {
  readonly toastList: ToastItem[]
  readonly message: ToastFuncType
  readonly success: ToastFuncType
  readonly error: ToastFuncType
  readonly remove: (idx: number) => void
}

export interface ReturningUseToasts {
  readonly message: ToastFuncType
  readonly success: ToastFuncType
  readonly error: ToastFuncType
}
