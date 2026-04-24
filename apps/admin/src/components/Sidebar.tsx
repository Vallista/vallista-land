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
        <NavLink to="/branches" className={({ isActive }) => (isActive ? 'active' : undefined)}>
          브랜치
        </NavLink>
        <NavLink to="/drafts" className={({ isActive }) => (isActive ? 'active' : undefined)}>
          임시저장
        </NavLink>
        <NavLink to="/media" className={({ isActive }) => (isActive ? 'active' : undefined)}>
          미디어
        </NavLink>
        <div className="sidebar__section">분석</div>
        <NavLink to="/analytics" className={({ isActive }) => (isActive ? 'active' : undefined)}>
          애널리틱스
        </NavLink>
        <NavLink to="/stats" className={({ isActive }) => (isActive ? 'active' : undefined)}>
          콘텐츠 통계
        </NavLink>
        <NavLink to="/links" className={({ isActive }) => (isActive ? 'active' : undefined)}>
          링크 체커
        </NavLink>
        <NavLink to="/backlinks" className={({ isActive }) => (isActive ? 'active' : undefined)}>
          백링크
        </NavLink>
        <div className="sidebar__section">정리</div>
        <NavLink to="/series" className={({ isActive }) => (isActive ? 'active' : undefined)}>
          시리즈
        </NavLink>
        <NavLink to="/presets" className={({ isActive }) => (isActive ? 'active' : undefined)}>
          프리셋
        </NavLink>
      </nav>
      <div className="sidebar__foot">Pensmith</div>
    </aside>
  )
}
