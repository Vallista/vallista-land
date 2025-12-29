import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

export type NavCategory = 'articles' | 'notes' | 'projects'

interface NavContextType {
  selectedCategory: NavCategory
  setSelectedCategory: (category: NavCategory) => void
}

const NavContext = createContext<NavContextType | undefined>(undefined)

interface NavProviderProps {
  children: ReactNode
}

export const NavProvider: React.FC<NavProviderProps> = ({ children }) => {
  const [selectedCategory, setSelectedCategory] = useState<NavCategory>('articles')
  const location = useLocation()

  // URL 경로에 따라 카테고리 자동 설정
  useEffect(() => {
    const path = location.pathname
    if (path.startsWith('/articles')) {
      setSelectedCategory('articles')
    } else if (path.startsWith('/notes')) {
      setSelectedCategory('notes')
    } else if (path.startsWith('/projects')) {
      setSelectedCategory('projects')
    } else {
      setSelectedCategory('articles') // 기본값
    }
  }, [location.pathname])

  return <NavContext.Provider value={{ selectedCategory, setSelectedCategory }}>{children}</NavContext.Provider>
}

export const useNav = (): NavContextType => {
  const context = useContext(NavContext)
  if (context === undefined) {
    throw new Error('useNav must be used within a NavProvider')
  }
  return context
}
