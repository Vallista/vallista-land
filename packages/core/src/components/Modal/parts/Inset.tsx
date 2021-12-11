import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { FC } from 'react'

import { useModalContext } from '../context'

const Inset: FC = (props) => {
  const { children } = useModalContext(props)

  return <Wrapper>{children}</Wrapper>
}

const Wrapper = styled.div`
  margin: 0 -24px;
  ${({ theme }) => css`
    border-top: 1px solid ${theme.colors.PRIMARY.ACCENT_2};
    border-bottom: 1px solid ${theme.colors.PRIMARY.ACCENT_2};
    background: 1px solid ${theme.colors.PRIMARY.ACCENT_1};
    padding: 24px;
  `}
`

export { Inset }
