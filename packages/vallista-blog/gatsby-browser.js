import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { ThemeProvider, useTheme } from '@vallista-land/core'
import React, { useEffect, useState } from 'react'

import { Layout } from './src/components/Layout'

export function onInitialClientRender() {
  let modalRoot = document?.getElementById('modal-root') || null

  if (!modalRoot) {
    modalRoot = document.createElement('div')
    modalRoot.id = 'modal-root'
    document.body.appendChild(modalRoot)
  }
}

export function wrapRootElement({ element }) {
  return (
    <ThemeProvider>
      <Loader>{element}</Loader>
    </ThemeProvider>
  )
}

export function wrapPageElement({ element }) {
  return <InitializeElement element={element} />
}

const Loader = ({ children }) => {
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
  }, [])

  return <Loading loading={loading}>{children}</Loading>
}

const Loading = styled.div`
  transition: opacity 0.2s ease;
  opacity: 0;

  ${({ loading }) => css`
    ${loading &&
    css`
      opacity: 1;
    `}
  `}
`

const InitializeElement = ({ element }) => {
  const theme = useTheme()

  if (typeof window !== 'undefined') {
    if (window.localStorage.getItem('theme') === 'light') {
      document.body.style.backgroundColor = '#fff'
      theme.state.changeTheme('light')
    } else {
      document.body.style.backgroundColor = '#000'
      theme.state.changeTheme('dark')
    }
  }

  return <Layout>{element}</Layout>
}
