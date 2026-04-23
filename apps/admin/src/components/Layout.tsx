import { useCallback, useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import CIStatusBar from './CIStatusBar'
import TopBar from './TopBar'

const SIDEBAR_KEY = 'admin.sidebar.collapsed'

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === '1'
  } catch {
    return false
  }
}

export default function Layout() {
  const [collapsed, setCollapsed] = useState<boolean>(() => readCollapsed())

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0')
    } catch {
      // ignore
    }
  }, [collapsed])

  const toggle = useCallback(() => setCollapsed((v) => !v), [])

  return (
    <div className={collapsed ? 'app app--no-sidebar' : 'app'}>
      {!collapsed && <Sidebar />}
      <div className="app__main">
        <TopBar sidebarCollapsed={collapsed} onToggleSidebar={toggle} />
        <CIStatusBar />
        <main className="main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
