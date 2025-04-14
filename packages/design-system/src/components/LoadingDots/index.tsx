import { css, keyframes, Theme } from '@emotion/react'
import styled from '@emotion/styled'

import { LoadingDotsProps } from './type'
import { useLoadingDots } from './useLoadingDots'

export const LoadingDots = (props: Partial<LoadingDotsProps>) => {
  const { size, children } = useLoadingDots(props)

  return (
    <Container style={{ '--loading-dots-size': `${size}px` }}>
      {children && <ChildrenContainer>{children}</ChildrenContainer>}
      <LoadingDot />
      <LoadingDot />
      <LoadingDot />
    </Container>
  )
}

const Container = styled.span`
  display: inline-flex;
  align-items: center;
  height: auto;
`

const ChildrenContainer = styled.div`
  margin-right: 12px;
`

const LoadingDot = styled.span`
  width: var(--loading-dots-size);
  height: var(--loading-dots-size);
  border-radius: 50%;
  ${({ theme }) => css`
    animation: ${LoadingDotBlink(theme)} 1.4s both infinite;
    background: ${theme.colors.PRIMARY.ACCENT_2};
  `}
  display: inline-block;
  margin: 0 1px;

  &:nth-of-type(2) {
    animation-delay: 0.2s;
  }

  &:nth-of-type(3) {
    animation-delay: 0.4s;
  }
`

const LoadingDotBlink = (theme: Theme) => keyframes`
  0% {
    background: ${theme.colors.PRIMARY.ACCENT_2};
  }
  
  50% {
    background: ${theme.colors.PRIMARY.ACCENT_6};
  }

  100% {
    background: ${theme.colors.PRIMARY.ACCENT_2};
  }
`
