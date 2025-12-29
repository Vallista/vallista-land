import { Routes, Route } from 'react-router-dom'
import { Providers } from '@app/providers'
import { Layout } from '@shared/ui/Layout'
import { HomePage } from '@pages/home'
import { ArticlePage } from '@pages/article'
import { ResumePage } from '@pages/resume'

export function App() {
  return (
    <Providers>
      <Routes>
        <Route element={<Layout />}>
          <Route path='/' element={<HomePage />} />
          <Route path='/articles' element={<HomePage />} />
          <Route path='/articles/:slug' element={<ArticlePage />} />
          <Route path='/notes' element={<HomePage />} />
          <Route path='/notes/:slug' element={<ArticlePage />} />
          <Route path='/projects' element={<HomePage />} />
          <Route path='/projects/:slug' element={<ArticlePage />} />
          <Route path='/resume' element={<ResumePage />} />
        </Route>
      </Routes>
    </Providers>
  )
}
