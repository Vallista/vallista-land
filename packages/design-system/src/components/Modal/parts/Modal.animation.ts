import { keyframes } from '@emotion/react'

const FadeIn = keyframes`
  0% {
    opacity: 0;
  }

  100% {
    opacity: 0.25;
  }
`

const FadeInMobile = keyframes`
  0% {
    opacity: 0;
  }

  100% {
    opacity: 0.75;
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

const FadeOutMobile = keyframes`
  0% {
    opacity: 0.75;
  }

  100% {
    opacity: 0;
  }
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

const SlideBottomUp = keyframes`
  0% {
    transform: translate3d(0, 100%, 0);
  }

  100% {
    transform: translate3d(0, 0, 0);
  }
`

const SlideTopDown = keyframes`
  0% {
    transform: translate3d(0, 0, 0);
  }

  100% {
    transform: translate3d(0, 100%, 0);
  }
`

export { FadeIn, FadeInMobile, FadeOut, FadeOutMobile, FadeInWithDown, FadeOutWithUp, SlideBottomUp, SlideTopDown }
