import { NavMenus } from '@/apps/layout/components/NavBar/utils/type'

import ArticleIcon from '@/assets/icons/article.svg?react'
import NoteIcon from '@/assets/icons/note.svg?react'
import ProjectIcon from '@/assets/icons/folder.svg?react'
import GithubIcon from '@/assets/icons/github.svg?react'
import TwitterIcon from '@/assets/icons/twitter.svg?react'
import FacebookIcon from '@/assets/icons/facebook.svg?react'

export const NavTop: NavMenus = [
  {
    id: 'articles',
    name: '아티클',
    icon: <ArticleIcon />,
    path: '/contents/articles'
  },
  {
    id: 'notes',
    name: '노트',
    icon: <NoteIcon />,
    path: '/contents/notes'
  },
  {
    id: 'projects',
    name: '프로젝트',
    icon: <ProjectIcon />,
    path: '/contents/projects'
  }
]

export const NavBottom: NavMenus = [
  {
    id: 'github',
    name: 'Github',
    icon: <GithubIcon />,
    path: 'https://github.com/vallista'
  },
  {
    id: 'twitter',
    name: '트위터',
    icon: <TwitterIcon />,
    path: ''
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: <FacebookIcon />,
    path: 'https://facebook.com/gwangwhi.ma'
  }
]
