import styled from '@emotion/styled'
import { FC } from 'react'

import { useModalContext } from '../context'

const Header: FC = (props) => {
  const { children } = useModalContext(props)

  return (
    <Wrapper>
      <h3>{children}</h3>
    </Wrapper>
  )
}

const Wrapper = styled.header`
  background: ${({ theme }) => theme.colors.PRIMARY.BACKGROUND};
  color: ${({ theme }) => theme.colors.PRIMARY.FOREGROUND};
  padding: 19px 14px;
  text-align: center;
  text-transform: uppercase;
`

export { Header }
