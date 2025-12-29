import { useModalContext } from '../context'
import { modalActions } from './Actions.css'

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

  return <div className={modalActions}>{children}</div>
}

export { Actions }
