export interface ModalProps {
  active: boolean
  onClickOutSide: () => void
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
