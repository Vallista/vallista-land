import { ReactNode } from 'react'
import * as Styled from './index.style'

interface Props {
  slug: string
  children: ReactNode
}

export const Loading = (props: Props) => {
  const { children } = props

  return <div className={Styled.wrap}>{children}</div>
}
