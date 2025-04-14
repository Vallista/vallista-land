import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router'
import { ThemeProvider } from '@vallista/design-system'

import { Layout } from './components/Layout'

import AboutMePage from './pages/about-me'
import ArticlePage from './pages/contents/articles'
import ResumePage from './pages/resume'
import ProjectPage from './pages/contents/projects'
import NotePage from './pages/contents/notes'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Layout />}>
            <Route index element={<AboutMePage />} />
            <Route path='resume' element={<ResumePage />} />
            <Route path='contents'>
              <Route path='projects'>
                <Route path=':id' element={<ProjectPage />} />
              </Route>
              <Route path='articles'>
                <Route path=':id' element={<ArticlePage />} />
              </Route>
              <Route path='notes'>
                <Route path=':id' element={<NotePage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
)
