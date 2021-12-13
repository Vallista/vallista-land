import styled from '@emotion/styled'
import { FC } from 'react'

import { useModalContext } from '../context'

/**
 * # Modal.Actions
 *
 * 모달의 버튼 액션 그룹 영역입니다.
 *
 * @example ```tsx
 * <Modal.Actions>This is a modal</Modal.Actions>
 * ```
 */
const Actions: FC = (props) => {
  const { children } = useModalContext(props)

  return <Footer>{children}</Footer>
}

const Footer = styled.div`
  display: flex;
  position: sticky;
  bottom: 0;
  border-top: 1px solid ${({ theme }) => theme.colors.PRIMARY.ACCENT_2};
  border-bottom-right-radius: 8px;
  border-bottom-left-radius: 8px;
  overflow: hidden;
`

export { Actions }
