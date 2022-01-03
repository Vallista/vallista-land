import React from 'react'
import { ThemeProvider, useTheme } from '@vallista-land/core'

export function wrapRootElement({ element }) {
  return (
    <ThemeProvider>
      <InitializeElement>{element}</InitializeElement>
    </ThemeProvider>
  )
}

const InitializeElement = ({ children }) => {
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

  return <>{children}</>
}
