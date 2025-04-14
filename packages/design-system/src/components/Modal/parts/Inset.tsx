import { css } from '@emotion/react'
import styled from '@emotion/styled'

import { useModalContext } from '../context'

interface ModalInsetProps {
  children: React.ReactNode
}

const Inset = (props: ModalInsetProps) => {
  const { children } = useModalContext(props)

  return <Wrapper>{children}</Wrapper>
}

const Wrapper = styled.div`
  margin: 0 -1.5rem;
  ${({ theme }) => css`
    border-top: 1px solid ${theme.colors.PRIMARY.ACCENT_2};
    border-bottom: 1px solid ${theme.colors.PRIMARY.ACCENT_2};
    background: 1px solid ${theme.colors.PRIMARY.ACCENT_1};
    padding: 1.5rem;
  `}
`

export { Inset }
