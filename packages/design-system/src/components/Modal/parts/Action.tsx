import { useModalContext } from '../context'
import { modalActionButton } from './Action.css'

interface ActionProps {
  type?: 'button' | 'submit'
  disabled?: boolean
  onClick: (() => void) | (() => Promise<void>)
  children: React.ReactNode
}

/**
 * # Modal.Action
 *
 * 모달의 버튼 영역입니다. Actions 하위로 배치해주세요.
 *
 * @prop {ActionProps} {@link ActionProps} 기본 버튼 액션
 *
 * @example ```tsx
 * <Modal.Action onClick={() => void 0}>Button</Modal.Action>
 * ```
 */
const Action = (props: ActionProps) => {
  const { children, type = 'button', disabled, onClick } = useModalContext(props)

  return (
    <button className={modalActionButton} type={type} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}

export { Action }
