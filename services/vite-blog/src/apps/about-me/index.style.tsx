import { keyframes } from '@emotion/react'
import styled from '@emotion/styled'

const HandAnimation = keyframes`
  0% {
    transform: rotateZ(0);
  }

  50% {
    transform: rotateZ(30deg);
  }

  100% {
    transform: rotateZ(0deg);
  }
`

export const Wrapper = styled.div`
  margin-left: auto;
  margin-right: auto;
  max-width: 900px;
  padding: 2rem;
`

export const Header = styled.header`
  padding: 2rem 0;
`

export const Title = styled.div`
  margin-bottom: 1.5rem;
  max-width: 550px;

  & > span:first-of-type {
    position: relative;

    &::after {
      position: absolute;
      right: -4rem;
      top: -0.5rem;
      content: '✋';
      display: block;
      animation: ${HandAnimation} 1s ease-in-out infinite;
    }
  }
`

export const SubTitle = styled.div`
  max-width: 550px;
  margin-bottom: 2rem;
`

export const Contents = styled.section`
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  max-width: 900px;
  padding: 2rem;
`
