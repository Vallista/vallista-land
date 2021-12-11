import styled from '@emotion/styled'
import { FC } from 'react'

import { useModalContext } from '../context'

const SubTitle: FC = (props) => {
  const { children } = useModalContext(props)

  return <P>{children}</P>
}

const P = styled.p`
  font-size: 12px;
  font-weight: 400;
  line-height: 1.6;
`

export { SubTitle }
