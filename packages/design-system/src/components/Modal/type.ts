export interface ModalProps {
  active?: boolean
  onClickOutSide?: () => void
  children?: React.ReactNode
  // Accessibility props
  'aria-label'?: string
  'aria-describedby'?: string
  'aria-labelledby'?: string
  // Event handlers
  onClose?: () => void
  onOpen?: () => void
}

export interface ReturningUseModal {
  active: boolean
  open: () => void
  close: () => void
}

export enum ModalAnimationState {
  IDLE = 0,
  FADE_IN,
  ALIVE,
  FADE_OUT,
  DEAD,
  MAX
}

export interface ModalContextState {
  readonly uniqueId: string
  readonly animationState: ModalAnimationState
  readonly changeAnimationState: (state: ModalAnimationState) => void
  readonly nextAnimationState: () => void
}

export type ModalContextStateWithProps = ModalContextState & Partial<ModalProps>
