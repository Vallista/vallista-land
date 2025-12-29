import { Text } from '@vallista/design-system'
import { Link, useLocation } from 'react-router-dom'
import { useSearch } from '@shared/context/SearchContext'
import { Search } from './Search'
import SidebarFileIcon from '@/assets/icons/sidebar-file.svg?react'
import * as Styled from './Sidebar.css'
import { useSidebar } from '@/shared/context/SidebarContext'

export interface SidebarContentProps {
  selectedCategory: string
  contents: any[]
}

const CATEGORY_MAP = {
  articles: '아티클',
  notes: '노트',
  projects: '프로젝트'
}

export const SidebarContent = ({ selectedCategory, contents }: SidebarContentProps) => {
  const { search } = useSearch()
  const { visible } = useSidebar()
  const location = useLocation()

  // 검색 필터링
  const filteredContents = contents.filter(
    (content) => content.draft !== true && content.title.toLowerCase().includes(search.toLowerCase())
  )

  // 현재 경로가 해당 콘텐츠와 일치하는지 확인
  const isActive = (slug: string) => {
    return location.pathname === `/${selectedCategory}/${slug}`
  }

  // 카테고리에 따른 링크 경로 생성
  const getContentPath = (slug: string) => {
    return `/${selectedCategory}/${slug}`
  }

  return (
    <div className={Styled.content}>
      <div className={Styled.header}>
        <Text size={14} weight={500}>
          {CATEGORY_MAP[selectedCategory as keyof typeof CATEGORY_MAP]} ({filteredContents.length})
        </Text>
      </div>
      <div className={Styled.searchContainer}>
        <Search />
      </div>
      <div className={Styled.list}>
        {filteredContents.map((content, index) => (
          <Link
            key={index}
            to={getContentPath(content.slug)}
            className={`${Styled.item} ${isActive(content.slug) ? Styled.itemActive : ''}`}
            onClick={() => {
              // 링크 클릭 시 스크롤을 최상단으로 이동
              window.scrollTo(0, 0)
              visible()
            }}
          >
            <SidebarFileIcon className={Styled.itemIcon} />
            <div className={Styled.itemText}>{content.title}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
