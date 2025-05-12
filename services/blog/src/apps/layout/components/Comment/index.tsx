import { Spinner, useMount } from '@vallista/design-system'
import { FC, useRef, useState } from 'react'

import * as Styled from './Comment.style'

export const Comment: FC = () => {
  const ref = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<'pending' | 'success' | 'failure'>('pending')

  useMount(() => {
    if (typeof window === 'undefined') return // SSR 방어

    const hasScript = ref.current?.children ?? []
    if (hasScript.length > 0) return

    const scriptEl = document.createElement('script')
    scriptEl.onload = () => setState('success')
    scriptEl.onerror = () => setState('failure')
    scriptEl.async = true
    scriptEl.src = 'https://utteranc.es/client.js'
    scriptEl.setAttribute('repo', 'Vallista/vallista.github.io')
    scriptEl.setAttribute('issue-term', 'title')
    scriptEl.setAttribute('theme', 'github-light')
    scriptEl.setAttribute('crossorigin', 'anonymous')
    ref.current?.appendChild(scriptEl)
  })

  return (
    <Styled._Wrapper>
      {state !== 'success' && <Spinner size={50} />}
      <div ref={ref} />
    </Styled._Wrapper>
  )
}
