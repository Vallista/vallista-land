import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { Layout } from './apps/layout'

import AboutMePage from './apps/about-me'
import ArticlePage from './apps/contents/articles'
import ResumePage from './apps/resume'
import ProjectPage from './apps/contents/projects'
import NotePage from './apps/contents/notes'
import { GlobalProvider } from './context'
import { HelmetProvider } from 'react-helmet-async'
import { css, Global } from '@emotion/react'

const App = () => {
  if (import.meta.env.PROD) {
    const urlParams = new URLSearchParams(window.location.search)
    const redirect = urlParams.get('redirect')
    if (redirect) {
      history.replaceState(null, '', redirect)
    }
  }

  return (
    <GlobalProvider>
      <Global
        styles={css`
          body {
            background-color: #fff;
            color: #000;
          }

          @media (prefers-color-scheme: dark) {
            body {
              background-color: #000;
              color: #fff;
            }
          }
        `}
      />
      <HelmetProvider>
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
      </HelmetProvider>
    </GlobalProvider>
  )
}

export default App
