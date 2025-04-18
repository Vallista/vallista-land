import { Image } from '@vallista/design-system'

import { NavCategoryType, NavFooterType } from '../src/components/NavBar/type'
import profile from '../static/profile.png'

import HomeIcon from '@/assets/icons/home.svg?react'
import FolderIcon from '@/assets/icons/folder.svg?react'
import GithubIcon from '@/assets/icons/github.svg?react'
import TwitterIcon from '@/assets/icons/twitter.svg?react'
import FacebookIcon from '@/assets/icons/facebook.svg?react'

export const NavCategory: NavCategoryType = {
  me: {
    name: '제가 궁금하세요?',
    icon: <Image src={profile as unknown as string} width={55} height={55} />,
    link: '/resume'
  },
  home: {
    name: '홈으로 갑니다!',
    icon: <HomeIcon />,
    link: '/'
  },
  posts: {
    name: '제가 쓴 글을 보세요!',
    icon: <FolderIcon />,
    link: '/posts'
  }
  // tags: {
  //   name: '태그 단위로 글을 보세요!',
  //   icon: (
  //     <svg
  //       viewBox='0 0 24 24'
  //       width='32'
  //       height='32'
  //       stroke='currentColor'
  //       strokeWidth='1.5'
  //       strokeLinecap='round'
  //       strokeLinejoin='round'
  //       fill='none'
  //       shapeRendering='geometricPrecision'
  //     >
  //       <path d='M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z' />
  //       <path d='M7 7h.01' />
  //     </svg>
  //   ),
  //   link: '/tags'
  // }
}

export const NavFooter: NavFooterType = {
  github: {
    name: 'Github',
    icon: <GithubIcon />,
    link: 'https://github.com/vallista'
  },
  twitter: {
    name: '',
    icon: <TwitterIcon />,
    link: ''
  },
  secondary: {
    name: 'Facebook',
    icon: <FacebookIcon />,
    link: 'https://facebook.com/gwangwhi.ma'
  }
}
