import ArticleIcon from '@/assets/icons/article.svg?react'
import NoteIcon from '@/assets/icons/note.svg?react'
import ProjectIcon from '@/assets/icons/folder.svg?react'
import { NavButton } from './NavButton'
import { useNav } from '@shared/context/NavContext'
import * as Styled from './NavBar.css'
import { useSidebar } from '@/shared/context/SidebarContext'

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
