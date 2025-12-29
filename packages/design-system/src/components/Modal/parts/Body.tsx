import { useModalContext } from '../context'
import { modalBody } from './Body.css'

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

  return <div className={modalBody}>{children}</div>
}

export { Body }
