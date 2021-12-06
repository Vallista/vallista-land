import { Colors, Text, ThemeProvider } from 'core'
import { VFC } from 'react'
import './App.css'

const App: VFC = () => (
  <ThemeProvider>
    <Text size={32} color={Colors.HIGHLIGHT.PINK} weight={600}>
      홈!
    </Text>
  </ThemeProvider>
)

export default App
