import styled from '@emotion/styled'

import { useModalContext } from '../context'

interface ModalSubTitleProps {
  children: React.ReactNode
}

/**
 * # Modal.SubTitle
 *
 * 모달의 서브타이틀 영역입니다.
 *
 * @example ```tsx
 * <Modal.SubTitle>This is a modal</Modal.SubTitle>
 * ```
 */
const SubTitle = (props: ModalSubTitleProps) => {
  const { children } = useModalContext(props)

  return <P>{children}</P>
}

const P = styled.p`
  font-size: 0.75rem;
  font-weight: 400;
  line-height: 1.6;
`

export { SubTitle }
