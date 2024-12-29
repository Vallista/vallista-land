import styled from '@emotion/styled'
import { FC } from 'react'

import { useModalContext } from '../context'

/**
 * # Modal.Title
 *
 * 모달의 타이틀 영역입니다.
 *
 * @example ```tsx
 * <Modal.Title>This is a modal</Modal.Title>
 * ```
 */
const Title: FC<{ children: React.ReactNode }> = (props) => {
  const { children } = useModalContext(props)

  return <H3>{children}</H3>
}

const H3 = styled.h3`
  font-size: 1.25rem;
  letter-spacing: -0.4;
  font-weight: 600;
  margin: 0;
  line-height: 1.5;
`

export { Title }
