import ArticleIcon from '@shared/assets/icons/article.svg?react'
import ProjectIcon from '@shared/assets/icons/folder.svg?react'
import NoteIcon from '@shared/assets/icons/note.svg?react'
import { useNav } from '@shared/context/NavContext'
import { useSidebar } from '@shared/context/SidebarContext'

import * as Styled from './NavBar.css'
import { NavButton } from './NavButton'

const navItems = [
  {
    id: 'articles',
    name: '아티클',
    icon: <ArticleIcon className={Styled.categoryIcon} />,
    path: '/articles',
    category: 'articles' as const
  },
  {
    id: 'notes',
    name: '노트',
    icon: <NoteIcon className={Styled.categoryIcon} />,
    path: '/notes',
    category: 'notes' as const
  },
  {
    id: 'projects',
    name: '프로젝트',
    icon: <ProjectIcon className={Styled.categoryIcon} />,
    path: '/projects',
    category: 'projects' as const
  }
]

export const NavBarTop = () => {
  const { selectedCategory, setSelectedCategory } = useNav()
  const { visible, isVisible } = useSidebar()

  const isCategoryActive = (category: 'articles' | 'notes' | 'projects') => {
    return selectedCategory === category
  }

  const handleCategoryClick = (category: 'articles' | 'notes' | 'projects') => {
    if ((isVisible && category === selectedCategory) || !isVisible) {
      visible()
    }

    setSelectedCategory(category)
  }

  return (
    <nav className={Styled.wrapper}>
      {navItems.map((item) => (
        <NavButton
          key={item.id}
          className={isCategoryActive(item.category) ? Styled.categoryActive : ''}
          onClick={() => handleCategoryClick(item.category)}
          title={item.name}
        >
          {item.icon}
        </NavButton>
      ))}
    </nav>
  )
}
