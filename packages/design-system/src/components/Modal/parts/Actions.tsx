import styled from '@emotion/styled'

import { useModalContext } from '../context'

interface ModalActionsProps {
  children: React.ReactNode
}

/**
 * # Modal.Actions
 *
 * 모달의 버튼 액션 그룹 영역입니다.
 *
 * @example ```tsx
 * <Modal.Actions>This is a modal</Modal.Actions>
 * ```
 */
const Actions = (props: ModalActionsProps) => {
  const { children } = useModalContext(props)

  return <Footer>{children}</Footer>
}

const Footer = styled.div`
  display: flex;
  position: sticky;
  bottom: 0;
  border-top: 1px solid ${({ theme }) => theme.colors.PRIMARY.ACCENT_2};
  border-bottom-right-radius: 0.5rem;
  border-bottom-left-radius: 0.5rem;
  overflow: hidden;
`

export { Actions }
