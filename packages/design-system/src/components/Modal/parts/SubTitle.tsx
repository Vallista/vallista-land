import { useModalContext } from '../context'
import { modalSubTitle } from './SubTitle.css'

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

  return <p className={modalSubTitle}>{children}</p>
}

export { SubTitle }
