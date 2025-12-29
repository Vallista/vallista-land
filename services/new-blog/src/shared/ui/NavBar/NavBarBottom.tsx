import * as Styled from './NavBar.css'
import GithubIcon from '@/assets/icons/github.svg?react'
import TwitterIcon from '@/assets/icons/twitter.svg?react'
import FacebookIcon from '@/assets/icons/facebook.svg?react'
import { NavButton } from './NavButton'

const socialItems = [
  {
    id: 'github',
    name: 'Github',
    icon: <GithubIcon className={Styled.categoryIcon} />,
    url: 'https://github.com/vallista'
  },
  {
    id: 'twitter',
    name: '트위터',
    icon: <TwitterIcon className={Styled.categoryIcon} />,
    url: ''
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: <FacebookIcon className={Styled.categoryIcon} />,
    url: ''
  }
]

export const NavBarBottom = () => {
  const handleSocialClick = (url: string) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <nav className={Styled.wrapper}>
      {socialItems.map((item) => (
        <NavButton key={item.id} onClick={() => handleSocialClick(item.url)} title={item.name} disabled={!item.url}>
          {item.icon}
        </NavButton>
      ))}
    </nav>
  )
}
