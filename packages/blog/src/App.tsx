import { VFC } from 'react'
import './App.css'
import { HelloWorld } from 'core/src/test'

const App: VFC = () => (
  <div>
    홈! <HelloWorld />
  </div>
)

export default App
