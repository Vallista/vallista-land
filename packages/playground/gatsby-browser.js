import React from 'react'
import { ThemeProvider } from '@vallista/core'

export function wrapRootElement({ element }) {
  return <ThemeProvider>{element}</ThemeProvider>
}

// export function onClientEntry() {
//   document.body.children[0].style.opacity = 0
//   document.body.children[0].style.transition = 'opacity 0.2s ease'

//   window.onload = () => {
//     setTimeout(() => {
//       document.body.children[0].style.opacity = 1
//     }, 100)
//   }
// }
