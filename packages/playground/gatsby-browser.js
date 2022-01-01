import React from 'react'
import { ThemeProvider } from '@vallista-land/core'

export function wrapRootElement({ element }) {
  return <ThemeProvider>{element}</ThemeProvider>
}

export function wrapPageElement({ element }) {
  document.addEventListener('load', () => {
    console.log('hello')
  })

  return <>{element}</>
}
