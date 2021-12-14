import styled from '@emotion/styled'
import { ThemeProvider } from 'core'
import { VFC } from 'react'

import { Card } from './components/Card'
import ButtonPlayground from './pages/ButtonPlayground'
import ContainerPlayground from './pages/ContainerPlayground'
import ModalPlayground from './pages/ModalPlayground'
import RadioPlayground from './pages/RadioPlayground'
import SelectPlayground from './pages/SelectPlayground'
import SpacerPlayground from './pages/SpacerPlayground'
import SpinnerPlayground from './pages/SpinnerPlayground'
import TogglePlayground from './pages/TogglePlayground'

const App: VFC = () => {
  return (
    <Wrap>
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
        <Card title='Radio'>
          <RadioPlayground />
        </Card>
        <Card title='Select'>
          <SelectPlayground />
        </Card>
        <Card title='Spacer'>
          <SpacerPlayground />
        </Card>
      </ThemeProvider>
    </Wrap>
  )
}

const Wrap = styled.div`
  padding: 0 24px 50px 24px;
`

export default App
