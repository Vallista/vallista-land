import { NavLink, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useCounts } from '@/state/CountsContext'
import { CATEGORIES, CATEGORY_LABEL } from '@/lib/types'

export default function Sidebar() {
  const { counts, refresh } = useCounts()
  const location = useLocation()

  // 경로가 바뀔 때마다 한 번 더 카운트를 동기화 (이동/삭제/생성 이후를 자연스럽게 커버)
  useEffect(() => {
    void refresh()
  }, [location.pathname, refresh])

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">Vallista 블로그 운영 툴</div>
      <nav className="sidebar__nav">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : undefined)}>
          대시보드
        </NavLink>
        <div className="sidebar__section">콘텐츠</div>
        {CATEGORIES.map((cat) => (
          <NavLink
            key={cat}
            to={`/posts/${cat}`}
            className={({ isActive }) => (isActive ? 'active' : undefined)}
          >
            <span>{CATEGORY_LABEL[cat]}</span>
            <span className="sidebar__count">{counts[cat] ?? '…'}</span>
          </NavLink>
        ))}
        <div className="sidebar__section">작업</div>
        <NavLink to="/publish" className={({ isActive }) => (isActive ? 'active' : undefined)}>
          배포
        </NavLink>
        <NavLink to="/analytics" className={({ isActive }) => (isActive ? 'active' : undefined)}>
          애널리틱스
        </NavLink>
      </nav>
      <div className="sidebar__foot">vallista-land</div>
    </aside>
  )
}
