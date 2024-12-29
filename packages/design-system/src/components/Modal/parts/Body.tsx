import styled from '@emotion/styled'
import { FC } from 'react'

import { useModalContext } from '../context'

/**
 * # Modal.Body
 *
 * 모달의 바디 영역입니다.
 *
 * @example ```tsx
 * <Modal.Body>This is a modal</Modal.Body>
 * ```
 */
const Body: FC<{ children: React.ReactNode }> = (props) => {
  const { children } = useModalContext(props)

  return <Wrapper>{children}</Wrapper>
}

const Wrapper = styled.div`
  padding: 1.5rem;
  font-size: 0.875rem;
  line-height: 1.6;
`

export { Body }
