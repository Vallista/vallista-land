import { createRoot } from 'react-dom/client'
import './index.css'
// 디자인시스템 CSS import
import '@vallista/design-system/global.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(<App />)
