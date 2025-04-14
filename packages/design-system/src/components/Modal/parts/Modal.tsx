import { KeyboardEventHandler, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

import { ModalProvider, useModalContext } from '../context'
import { ModalAnimationState, ModalProps } from '../type'
import { BackDrop, Container, ModalContainer, Wrap, Wrapper } from './Modal.style'

/**
 * # Modal.Modal
 *
 * @description [vercel design modal](https://vercel.com/design/modal)
 *
 * 모달의 베이스가 되는 컴포넌트입니다.
 * 하위에 Modal의 요소들을 선언하여 사용하셔야합니다.
 *
 * @param {ModalProps} {@link ModalProps} 기본적인 modal 요소
 *
 * @example ```tsx
 * const { active, open, close } = useModal()
 *
 * return (
 * <>
 *   <TemporaryContainer>
 *     <Button onClick={open}>알럿 출력</Button>
 *   </TemporaryContainer>
 *
 *   <Modal.Modal active={active} onClickOutSide={close}>
 *    <Modal.Body>
 *      <Modal.Header>
 *        <Modal.Title>안녕하세요?</Modal.Title>
 *        <Modal.SubTitle>This is a modal</Modal.SubTitle>
 *      </Modal.Header>
 *      <Modal.Inset>
 *        <Text>Content within the inset.</Text>
 *      </Modal.Inset>
 *      <br />
 *      <Text>Content outside the inset.</Text>
 *    </Modal.Body>
 *    <Modal.Actions>
 *      <Modal.Action onClick={close}>Cancel</Modal.Action>
 *      <Modal.Action onClick={close}>Submit</Modal.Action>
 *    </Modal.Actions>
 *  </Modal.Modal>
 * </>
 * )
 * ```
 */
export const Modal = ({ children, ...props }: Partial<ModalProps>) => {
  if (typeof document === 'undefined') return null

  return createPortal(
    <ModalProvider>
      <Contents {...props}>{children}</Contents>
    </ModalProvider>,
    document.getElementById('modal-root') ?? document.body
  )
}

const Contents = (props: Partial<ModalProps>) => {
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
      document.body.style.overflow = 'hidden'
      changeAnimationState(ModalAnimationState.FADE_IN)
    } else {
      if (animationState === ModalAnimationState.ALIVE) {
        document.body.style.overflow = ''
        changeAnimationState(ModalAnimationState.FADE_OUT)
      }
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
