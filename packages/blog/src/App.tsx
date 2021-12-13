import { ThemeProvider } from 'core'
import { VFC } from 'react'

import { Card } from './components/Card'
import ButtonPlayground from './pages/ButtonPlayground'
import ContainerPlayground from './pages/ContainerPlayground'
import ModalPlayground from './pages/ModalPlayground'
import SpinnerPlayground from './pages/SpinnerPlayground'
import { TogglePlayground } from './pages/TogglePlayground'

const App: VFC = () => {
  return (
    <ThemeProvider>
      <Card title='Container'>
        <ContainerPlayground />
      </Card>
      <Card title='Button'>
        <ButtonPlayground />
      </Card>
      <Card title='Modal'>
        <ModalPlayground />
      </Card>
      <Card title='Spinner'>
        <SpinnerPlayground />
      </Card>
      <Card title='Toggle'>
        <TogglePlayground />
      </Card>
    </ThemeProvider>
  )
}

export default App
