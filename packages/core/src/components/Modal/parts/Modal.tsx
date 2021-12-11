import { css, keyframes } from '@emotion/react'
import styled from '@emotion/styled'
import { FC, KeyboardEventHandler, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

import { ModalProvider, useModalContext } from '../context'
import { ModalAnimationState, ModalContextStateWithProps, ModalProps } from '../type'

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

const Wrap = styled.div<Pick<ModalContextStateWithProps, 'animationState'>>`
  ${({ animationState }) =>
    animationState === ModalAnimationState.IDLE &&
    css`
      visibility: hidden;
    `}
`

const FadeIn = keyframes`
  0% {
    opacity: 0;
  }

  100% {
    opacity: 0.25;
  }
`

const FadeOut = keyframes`
  0% {
    opacity: 0.25;
  }

  100% {
    opacity: 0;
  }
`

const isAnimationIdle = (state: ModalAnimationState): boolean => {
  return state === ModalAnimationState.IDLE
}

const isAnimationStart = (state: ModalAnimationState): boolean => {
  return state > ModalAnimationState.IDLE && state < ModalAnimationState.FADE_OUT
}

const isAnimationEnd = (state: ModalAnimationState): boolean => {
  return state === ModalAnimationState.FADE_OUT
}

const BackDrop = styled.div<Pick<ModalContextStateWithProps, 'animationState' | 'onClickOutSide'>>`
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  height: 100%;
  width: 100%;
  opacity: 0;
  pointer-events: none;
  animation: none;
  ${({ theme, animationState, onClickOutSide }) => css`
    z-index: ${theme.layers.MODAL - 1};
    background-color: ${theme.colors.PRIMARY.FOREGROUND};

    ${onClickOutSide &&
    css`
      pointer-events: all;
    `}

    ${isAnimationIdle(animationState) &&
    css`
      top: -${theme.layers.CONCEAL}px;
      left: -${theme.layers.CONCEAL}px;
    `}

    ${isAnimationStart(animationState) &&
    css`
      animation: ${FadeIn} 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    `}

    ${isAnimationEnd(animationState) &&
    css`
      animation: ${FadeOut} 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    `}
  `};
`

const FadeInWithDown = keyframes`
  0% {
    transform: translate3d(0, -50px, 0);
    opacity: 0;
  }

  100% {
    transform: translate3d(0, 0, 0);
    opacity: 1;
  }
`

const FadeOutWithUp = keyframes`
  0% {
    transform: translate3d(0, 0, 0);
    opacity: 1;
  }
  
  100% {
    transform: translate3d(0, -50px, 0);
    opacity: 0;
  }
`

const Container = styled.div<Pick<ModalContextStateWithProps, 'animationState'>>`
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  align-content: center;
  flex-direction: column;
  height: 100vh;
  height: -webkit-fill-available;
  width: 100vw;
  animation: none;
  z-index: ${({ theme }) => theme.layers.MODAL};
  overflow: auto;
  border: none;
  outline: none;

  ${({ theme, animationState }) => css`
    ${isAnimationIdle(animationState) &&
    css`
      top: -${theme.layers.CONCEAL}px;
      left: -${theme.layers.CONCEAL}px;
    `}

    ${isAnimationStart(animationState) &&
    css`
      animation: ${FadeInWithDown} 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    `}

    ${isAnimationEnd(animationState) &&
    css`
      animation: ${FadeOutWithUp} 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    `}
  `};
`

const Wrapper = styled.div`
  width: 420px;
  height: auto;
  ${({ theme }) => css`
    box-shadow: ${theme.shadows.LARGE};
    background-color: ${theme.colors.PRIMARY.BACKGROUND};
    color: ${theme.colors.PRIMARY.FOREGROUND};
  `};
  border-radius: 8px;
  overflow: hidden;
  overflow-y: auto;
  outline: none;
`

const ModalContainer = styled.div`
  outline: 0;
`
