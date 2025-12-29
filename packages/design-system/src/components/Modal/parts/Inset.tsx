import { useModalContext } from '../context'
import { modalInset } from './Inset.css'

interface ModalInsetProps {
  children: React.ReactNode
}

const Inset = (props: ModalInsetProps) => {
  const { children } = useModalContext(props)

  return <div className={modalInset}>{children}</div>
}

export { Inset }
