import { css } from '@emotion/react'
import styled from '@emotion/styled'
// import { useWindowSize } from '@vallista-land/core'
import { useEffect, VFC } from 'react'

export const Sidebar: VFC = (props) => {
  return <Container></Container>
}

const Container = styled.aside`
  position: fixed;
  width: 320px;
  height: 100vh;
  top: 0;
  left: 80px;
  overflow-x: hidden;
  overflow-y: hidden;
  transition: transform 0.2s cubic-bezier(0.455, 0.03, 0.515, 0.955);
  transform: translateX(0);

  ${({ theme }) => css`
    z-index: ${theme.layers.AFTER_STANDARD - 1};
    background: ${theme.colors.PRIMARY.ACCENT_1};
    box-shadow: ${theme.shadows.SMALL};
  `}

  @media screen and (max-width: 1000px) {
    transform: translateX(-320px);
  }
`
