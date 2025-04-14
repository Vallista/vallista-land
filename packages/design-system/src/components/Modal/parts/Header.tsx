import styled from '@emotion/styled'

import { useModalContext } from '../context'

interface ModalHeaderProps {
  children: React.ReactNode
}

/**
 * # Modal.Header
 *
 * 모달의 헤더 영역입니다.
 *
 * @example ```tsx
 * <Modal.Header>This is a modal</Modal.Header>
 * ```
 */
const Header = (props: ModalHeaderProps) => {
  const { children } = useModalContext(props)

  return (
    <Wrapper>
      <div>{children}</div>
    </Wrapper>
  )
}

const Wrapper = styled.header`
  background: ${({ theme }) => theme.colors.PRIMARY.BACKGROUND};
  color: ${({ theme }) => theme.colors.PRIMARY.FOREGROUND};
  padding: 19px 14px;
  text-align: center;
  text-transform: uppercase;
`

export { Header }
