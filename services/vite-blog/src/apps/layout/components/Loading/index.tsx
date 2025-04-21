import { ReactNode, useEffect, useRef, useState } from 'react'
import * as Styled from './index.style'

interface Props {
  slug: string
  children: ReactNode
}

export const Loading = (props: Props) => {
  const { slug, children } = props
  const [keep, setKeep] = useState(slug)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return

    if (slug !== keep) {
      requestAnimationFrame(() => {
        setKeep(slug)
      })
    }
  }, [keep, slug])

  return (
    <Styled._Wrap ref={ref} css={slug === keep ? Styled.fadeInAnimation : undefined}>
      {children}
    </Styled._Wrap>
  )
}
