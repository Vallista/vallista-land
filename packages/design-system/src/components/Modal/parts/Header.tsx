import { useModalContext } from '../context'
import { modalHeader } from './Header.css'

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
    <header className={modalHeader}>
      <div>{children}</div>
    </header>
  )
}

export { Header }
