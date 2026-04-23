import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CATEGORIES, CATEGORY_LABEL } from '@/lib/types'

type Props = {
  sidebarCollapsed: boolean
  onToggleSidebar: () => void
}

export default function TopBar({ sidebarCollapsed, onToggleSidebar }: Props) {
  const navigate = useNavigate()
  const [newOpen, setNewOpen] = useState(false)
  const newBtnRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!newOpen) return
    const onDoc = (e: MouseEvent) => {
      if (!newBtnRef.current) return
      if (!newBtnRef.current.contains(e.target as Node)) setNewOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [newOpen])

  return (
    <header className="topbar">
      <div className="topbar__lights" aria-hidden="true" />
      <button
        type="button"
        className="topbar__icon-btn"
        onClick={onToggleSidebar}
        aria-label={sidebarCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
        title={sidebarCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
      >
        <SidebarIcon />
      </button>
      <button
        type="button"
        className="topbar__icon-btn"
        onClick={() => navigate(-1)}
        aria-label="뒤로 가기"
        title="뒤로 가기"
      >
        <BackIcon />
      </button>

      <div className="topbar__center">
        <div className="topbar__search">
          <SearchIcon />
          <input
            type="text"
            placeholder="검색 (준비 중)"
            disabled
            aria-label="검색"
          />
          <kbd className="topbar__kbd">⌘K</kbd>
        </div>
      </div>

      <div className="topbar__right" ref={newBtnRef}>
        <button
          type="button"
          className="topbar__new-btn"
          onClick={() => setNewOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={newOpen}
        >
          <PlusIcon />
          <span>새 글</span>
        </button>
        {newOpen && (
          <div className="topbar__menu" role="menu">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                role="menuitem"
                className="topbar__menu-item"
                onClick={() => {
                  setNewOpen(false)
                  navigate(`/posts/${cat}/new`)
                }}
              >
                {CATEGORY_LABEL[cat]}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  )
}

function SidebarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" />
      <line x1="6" y1="2.5" x2="6" y2="13.5" stroke="currentColor" />
    </svg>
  )
}

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M9.5 3.5 5 8l4.5 4.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.3" />
      <path d="M9.2 9.2 12 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
