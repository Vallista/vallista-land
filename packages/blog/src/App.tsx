import { Colors, Text, ThemeProvider } from 'core'
import { VFC } from 'react'

import ButtonPlayground from './pages/ButtonPlayground'
import ModalPlayground from './pages/ModalPlayground'
import SpinnerPlayground from './pages/SpinnerPlayground'
import './App.css'

const App: VFC = () => {
  return (
    <ThemeProvider>
      <SpinnerPlayground />
      <ButtonPlayground />
      <ModalPlayground />
    </ThemeProvider>
  )
}

export default App
