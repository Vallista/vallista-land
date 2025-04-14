import { BrowserRouter, Route, Routes } from 'react-router'

import { Layout } from './components/Layout'

import AboutMePage from './pages/about-me'
import ArticlePage from './pages/contents/articles'
import ResumePage from './pages/resume'
import ProjectPage from './pages/contents/projects'
import NotePage from './pages/contents/notes'

const App = () => {
  return (
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
  )
}

export default App
