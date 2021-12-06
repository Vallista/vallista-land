import { VFC } from 'react'
import './App.css'
import { Text, ThemeProvider } from 'core'

const App: VFC = () => (
  <ThemeProvider>
    <Text>홈!</Text>
  </ThemeProvider>
)

export default App
