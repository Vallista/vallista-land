import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './routes/Home'
import PostsList from './routes/PostsList'
import PostDetail from './routes/PostDetail'
import PostEdit from './routes/PostEdit'
import PostNew from './routes/PostNew'
import Publish from './routes/Publish'
import Analytics from './routes/Analytics'
import { CountsProvider } from './state/CountsContext'

export default function App() {
  return (
    <BrowserRouter>
      <CountsProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/posts/:category" element={<PostsList />} />
            <Route path="/posts/:category/new" element={<PostNew />} />
            <Route path="/posts/:category/:slug" element={<PostDetail />} />
            <Route path="/posts/:category/:slug/edit" element={<PostEdit />} />
            <Route path="/publish" element={<Publish />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route
              path="*"
              element={<div className="err">페이지를 찾을 수 없습니다.</div>}
            />
          </Route>
        </Routes>
      </CountsProvider>
    </BrowserRouter>
  )
}
