import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './routes/Home'
import PostsList from './routes/PostsList'
import PostDetail from './routes/PostDetail'
import PostEdit from './routes/PostEdit'
import PostNew from './routes/PostNew'
import Publish from './routes/Publish'
import Analytics from './routes/Analytics'
import Drafts from './routes/Drafts'
import Media from './routes/Media'
import Stats from './routes/Stats'
import LinkChecker from './routes/LinkChecker'
import Series from './routes/Series'
import Presets from './routes/Presets'
import Backlinks from './routes/Backlinks'
import Branches from './routes/Branches'
import { CountsProvider } from './state/CountsContext'
import { SearchIndexProvider } from './state/SearchIndex'

export default function App() {
  return (
    <BrowserRouter>
      <CountsProvider>
        <SearchIndexProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/posts/:category" element={<PostsList />} />
            <Route path="/posts/:category/new" element={<PostNew />} />
            <Route path="/posts/:category/:slug" element={<PostDetail />} />
            <Route path="/posts/:category/:slug/edit" element={<PostEdit />} />
            <Route path="/publish" element={<Publish />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/drafts" element={<Drafts />} />
            <Route path="/media" element={<Media />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/links" element={<LinkChecker />} />
            <Route path="/series" element={<Series />} />
            <Route path="/presets" element={<Presets />} />
            <Route path="/backlinks" element={<Backlinks />} />
            <Route path="/branches" element={<Branches />} />
            <Route
              path="*"
              element={<div className="err">페이지를 찾을 수 없습니다.</div>}
            />
          </Route>
        </Routes>
        </SearchIndexProvider>
      </CountsProvider>
    </BrowserRouter>
  )
}
