import { keyframes } from '@emotion/react'
import styled from '@emotion/styled'

const anim = keyframes`
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
`

export const _Wrap = styled.div`
  animation: ${anim} 0.2s ease-in-out;
`
