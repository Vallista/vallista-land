import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { VFC } from 'react'

interface NavBarProps {}

export const NavBar: VFC<NavBarProps> = (props) => {
  const {} = props

  return <Container></Container>
}

const Container = styled.aside`
  min-width: 80px;
  height: 100vh;
  position: fixed;
  top: 0;

  ${({ theme }) => css`
    background: ${theme.colors.PRIMARY.ACCENT_2};
    z-index: ${theme.layers.AFTER_STANDARD};
  `}
`
