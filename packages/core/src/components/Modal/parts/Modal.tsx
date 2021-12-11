import { FC, KeyboardEventHandler, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

import { ModalProvider, useModalContext } from '../context'
import { ModalAnimationState, ModalProps } from '../type'
import { BackDrop, Container, ModalContainer, Wrap, Wrapper } from './Modal.style'

let modalRoot = document.getElementById('modal-root') || null

export const Modal: FC<Partial<ModalProps>> = ({ children, ...props }) => {
  if (!modalRoot) {
    modalRoot = document.createElement('div')
    modalRoot.id = 'modal-root'
    document.body.appendChild(modalRoot)
  }

  return createPortal(
    <ModalProvider>
      <Contents {...props}>{children}</Contents>
    </ModalProvider>,
    document.body
  )
}

const Contents: FC<Partial<ModalProps>> = (props) => {
  const {
    children,
    uniqueId,
    nextAnimationState,
    changeAnimationState,
    active,
    animationState,
    onClickOutSide,
    ...otherProps
  } = useModalContext(props)

  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (active) {
      changeAnimationState(ModalAnimationState.FADE_IN)
    } else {
      if (animationState === ModalAnimationState.ALIVE) changeAnimationState(ModalAnimationState.FADE_OUT)
    }
  }, [active])

  useEffect(() => {
    if (animationState === ModalAnimationState.ALIVE) {
      ref.current?.focus()
    }
  }, [animationState])

  return (
    <Wrap id={uniqueId} animationState={animationState}>
      <BackDrop animationState={animationState} {...otherProps} />
      <Container animationState={animationState} onAnimationEnd={nextAnimation}>
        <Wrapper
          ref={ref}
          tabIndex={1}
          role='dialog'
          aria-hidden
          aria-modal
          aria-labelledby='modal'
          onBlur={handleReset}
          onKeyDown={handleESCKeyDown}
        >
          <ModalContainer>{children}</ModalContainer>
        </Wrapper>
      </Container>
    </Wrap>
  )

  function nextAnimation(): void {
    nextAnimationState()
  }

  function handleReset(): void {
    onClickOutSide?.()
  }

  function handleESCKeyDown(e: Parameters<KeyboardEventHandler<HTMLDivElement>>[0]): void {
    if (e.key === 'Escape') handleReset()
  }
}
