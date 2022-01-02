import React from 'react'
import { ThemeProvider } from '@vallista-land/core'

export function wrapRootElement({ element }) {
  return <ThemeProvider>{element}</ThemeProvider>
}
