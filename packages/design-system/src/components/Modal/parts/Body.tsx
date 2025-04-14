import styled from '@emotion/styled'

import { useModalContext } from '../context'

interface ModalBodyProps {
  children: React.ReactNode
}

/**
 * # Modal.Body
 *
 * 모달의 바디 영역입니다.
 *
 * @example ```tsx
 * <Modal.Body>This is a modal</Modal.Body>
 * ```
 */
const Body = (props: ModalBodyProps) => {
  const { children } = useModalContext(props)

  return <Wrapper>{children}</Wrapper>
}

const Wrapper = styled.div`
  padding: 1.5rem;
  font-size: 0.875rem;
  line-height: 1.6;
`

export { Body }
