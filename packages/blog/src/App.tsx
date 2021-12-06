import { VFC } from 'react'
import './App.css'
import { HelloWorld, ThemeProvider } from 'core'

const App: VFC = () => (
  <ThemeProvider>
    홈! <HelloWorld />
  </ThemeProvider>
)

export default App
