import { css } from '@emotion/react'
import styled from '@emotion/styled'

import { ModalAnimationState, ModalContextStateWithProps } from '../type'
import {
  FadeIn,
  FadeInMobile,
  FadeInWithDown,
  FadeOut,
  FadeOutMobile,
  FadeOutWithUp,
  SlideBottomUp,
  SlideTopDown
} from './Modal.animation'

const isAnimationIdle = (state: ModalAnimationState): boolean => {
  return state === ModalAnimationState.IDLE
}

const isAnimationStart = (state: ModalAnimationState): boolean => {
  return state > ModalAnimationState.IDLE && state < ModalAnimationState.FADE_OUT
}

const isAnimationEnd = (state: ModalAnimationState): boolean => {
  return state === ModalAnimationState.FADE_OUT
}

const Wrap = styled.div<Pick<ModalContextStateWithProps, 'animationState'>>`
  /* ${({ animationState }) =>
    animationState === ModalAnimationState.IDLE &&
    css`
      visibility: hidden;
    `} */
`

const animationOption = '0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards'

const BackDrop = styled.div<Pick<ModalContextStateWithProps, 'animationState' | 'onClickOutSide'>>`
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  height: 100vh;
  width: 100%;
  opacity: 0;
  pointer-events: none;
  animation: none;

  ${({ theme, animationState, onClickOutSide }) => css`
    z-index: ${theme.layers.MODAL - 1};
    background-color: #111;

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
      animation: ${FadeIn} ${animationOption};

      @media (max-width: 600px) {
        animation: ${FadeInMobile} ${animationOption};
      }
    `}

    ${isAnimationEnd(animationState) &&
    css`
      animation: ${FadeOut} ${animationOption};

      @media (max-width: 600px) {
        animation: ${FadeOutMobile} ${animationOption};
      }
    `}
  `};
`

const Container = styled.div<Pick<ModalContextStateWithProps, 'animationState'>>`
  position: fixed;
  left: 0;
  width: 100vw;
  animation: none;
  z-index: ${({ theme }) => theme.layers.MODAL};
  overflow: auto;
  border: none;
  outline: none;

  @media (min-width: 601px) {
    top: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  @media (max-width: 600px) {
    bottom: 0;
  }

  ${({ theme, animationState }) => css`
    ${isAnimationIdle(animationState) &&
    css`
      top: -${theme.layers.CONCEAL}px;
      left: -${theme.layers.CONCEAL}px;
    `}

    ${isAnimationStart(animationState) &&
    css`
      transform: translate3d(0, 100%, 0);
      animation: ${FadeInWithDown} ${animationOption};

      @media (max-width: 600px) {
        animation: ${SlideBottomUp} ${animationOption};
      }
    `}

    ${isAnimationEnd(animationState) &&
    css`
      animation: ${FadeOutWithUp} ${animationOption};

      @media (max-width: 600px) {
        animation: ${SlideTopDown} ${animationOption};
      }
    `}
  `};
`

const Wrapper = styled.div`
  width: 420px;
  height: auto;
  border-radius: 0.5rem;
  overflow: hidden;
  overflow-y: auto;
  outline: none;

  @media (max-width: 600px) {
    width: 100%;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }

  ${({ theme }) => css`
    box-shadow: ${theme.shadows.LARGE};
    background-color: ${theme.colors.PRIMARY.BACKGROUND};
    color: ${theme.colors.PRIMARY.FOREGROUND};
  `};
`

const ModalContainer = styled.div`
  outline: 0;
`

export { Wrap, BackDrop, Container, Wrapper, ModalContainer }
