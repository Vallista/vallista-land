import { forwardRef } from 'react'

import { useModalContext } from '../context'
import { modalTitle } from './Title.css'

interface ModalTitleProps {
  children?: React.ReactNode
  id?: string
}

/**
 * # Modal.Title
 *
 * 모달의 타이틀 영역입니다.
 *
 * @example ```tsx
 * <Modal.Title>This is a modal</Modal.Title>
 * ```
 */
const Title = forwardRef<HTMLHeadingElement, ModalTitleProps>((props, ref) => {
  const { children, id } = useModalContext(props)
  const { uniqueId } = useModalContext({})

  return (
    <h3 ref={ref} id={id || `${uniqueId}-title`} className={modalTitle}>
      {children}
    </h3>
  )
})

Title.displayName = 'ModalTitle'

export { Title }
