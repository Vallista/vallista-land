import styled from '@emotion/styled'
import { FC } from 'react'

import { useModalContext } from '../context'

const Title: FC = (props) => {
  const { children } = useModalContext(props)

  return <H3>{children}</H3>
}

const H3 = styled.h3`
  font-size: 21px;
  letter-spacing: -0.4;
  font-weight: 600;
  margin: 0;
  line-height: 1.5;
`

export { Title }
