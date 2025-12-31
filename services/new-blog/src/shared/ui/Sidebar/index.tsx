import { useQuery } from '@tanstack/react-query'

import { useSidebar } from '@shared/context/SidebarContext'
import { useWindowSize } from '@shared/hooks'
import { loadAllContent } from '@shared/lib/content'

import * as Styled from './Sidebar.css'
import { SidebarContent } from './SidebarContent'


export interface SidebarProps {
  selectedCategory: string
}

export const Sidebar = ({ selectedCategory }: SidebarProps) => {
  const { isOpen, isVisible } = useSidebar()
  const { width } = useWindowSize()
  const isMobile = width < 1025

  const { data: contentData } = useQuery({
    queryKey: ['content'],
    queryFn: loadAllContent,
    staleTime: 5 * 60 * 1000 // 5분
  })

  // 선택된 카테고리에 따라 콘텐츠 필터링
  const getFilteredContents = () => {
    if (!contentData) return []

    switch (selectedCategory) {
      case 'articles':
        return contentData.articles || []
      case 'notes':
        return contentData.notes || []
      case 'projects':
        return contentData.projects || []
      default:
        return contentData.articles || []
    }
  }

  const filteredContents = getFilteredContents()

  const sidebarClass = isMobile
    ? isVisible
      ? Styled.visible
      : Styled.invisible
    : isOpen
      ? Styled.wrap
      : Styled.wrapFolded

  return (
    <aside className={`${Styled.base} ${sidebarClass}`}>
      <SidebarContent selectedCategory={selectedCategory} contents={filteredContents} />
    </aside>
  )
}
