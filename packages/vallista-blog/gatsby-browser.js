import React from 'react'
import { ThemeProvider, useTheme } from '@vallista-land/core'

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
  return <ThemeProvider>{element}</ThemeProvider>
}

export function wrapPageElement({ element }) {
  return <InitializeElement element={element} />
}

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
