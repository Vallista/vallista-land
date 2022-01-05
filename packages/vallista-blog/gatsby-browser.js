import React from 'react'
import { ThemeProvider, useTheme } from '@vallista-land/core'

import { Layout } from './src/components/Layout'

export function wrapRootElement({ element }) {
  return <ThemeProvider>{element}</ThemeProvider>
}

// let init = false

export function wrapPageElement({ element }) {
  // if (!init) {
  //   document.body.style.opacity = 0
  //   document.body.style.transition = 'opacity 0.2s ease'
  //   init = true
  // }

  return <InitializeElement element={element} />
}

// export function onInitialClientRender() {
//   setTimeout(() => (document.body.style.opacity = 1), 500)
// }

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
