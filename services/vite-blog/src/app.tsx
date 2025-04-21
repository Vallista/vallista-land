import { BrowserRouter, Route, Routes } from 'react-router'

import { Layout } from './apps/layout'

import AboutMePage from './apps/about-me'
import ArticlePage from './apps/contents/articles'
import ResumePage from './apps/resume'
import ProjectPage from './apps/contents/projects'
import NotePage from './apps/contents/notes'
import { GlobalProvider } from './context'

const App = () => {
  return (
    <GlobalProvider>
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
    </GlobalProvider>
  )
}

export default App
