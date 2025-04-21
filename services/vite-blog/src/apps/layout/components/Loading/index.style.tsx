import { css, keyframes } from '@emotion/react'
import styled from '@emotion/styled'

const fadeIn = keyframes`
    0% {
        opacity: 0;
    }
    100% {
        opacity: 1;
    }
`

export const fadeInAnimation = css`
  animation: ${fadeIn} 0.3s ease-in-out;
`

export const _Wrap = styled.div``
