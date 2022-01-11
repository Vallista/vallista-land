import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { Spinner, Text, useMount } from '@vallista-land/core'
import { VFC, useRef, useState } from 'react'

export const Comment: VFC = () => {
  const ref = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<{ status: 'pending' | 'success' | 'failure' }>({ status: 'pending' })

  useMount(() => {
    const hasScript = ref.current?.children ?? []

    if (hasScript.length > 0) return

    const scriptEl = document.createElement('script')
    scriptEl.onload = () => {
      setState({ status: 'success' })
    }
    scriptEl.onerror = () => {
      setState({ status: 'failure' })
    }
    scriptEl.async = true
    scriptEl.src = 'https://utteranc.es/client.js'
    scriptEl.setAttribute('repo', 'Vallista/vallista.github.io')
    scriptEl.setAttribute('issue-term', 'title')
    scriptEl.setAttribute('theme', 'github-light')
    scriptEl.setAttribute('crossorigin', 'anonymous')
    ref.current?.appendChild(scriptEl)
  })

  return (
    <Wrapper>
      <Text size={24} weight={700}>
        댓글 :)
      </Text>
      {state.status !== 'success' && <Spinner size={50} />}
      <div ref={ref}></div>
    </Wrapper>
  )
}

const Wrapper = styled.div`
  max-width: 900px;
  width: 100%;
  margin: 4rem auto;
  box-sizing: border-box;
  padding: 0 2rem 2rem;

  & > p {
    margin-bottom: 1.5rem;
    font-size: 1.8rem;
    ${({ theme }) => css`
      color: ${theme.colors.PRIMARY.FOREGROUND};
    `}
  }

  & > a {
    border: none !important;
    outline: none !important;
    transition: none !important;
    background: none !important;

    &:hover {
      background: none !important;
      border-color: none !important;
    }
  }
`
