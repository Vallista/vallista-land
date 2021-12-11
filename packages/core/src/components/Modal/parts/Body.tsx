import styled from '@emotion/styled'
import { FC } from 'react'

import { useModalContext } from '../context'

const Body: FC = (props) => {
  const { children } = useModalContext(props)

  return <Wrapper>{children}</Wrapper>
}

const Wrapper = styled.div`
  padding: 24px;
  font-size: 14px;
  line-height: 1.6;
`

export { Body }
