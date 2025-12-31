import { useRef } from 'react'

import { useMediaQuery } from '@shared/hooks/useMediaQuery'
import { usePreventScroll } from '@shared/hooks/usePreventScroll'

import * as Styled from './Header.css'
import { Logo } from './Logo'
import { SidebarToggle } from './SidebarToggle'
import { ThemeToggle } from './ThemeToggle'

export const Header = () => {
  const isMobile = useMediaQuery('(max-width: 1024px)')
  const headerRef = useRef<HTMLElement>(null)
  usePreventScroll(headerRef, isMobile)

  return (
    <header ref={headerRef} className={Styled.container} role='banner'>
      <div className={Styled.wrapper}>
        <div className={Styled.left}>
          <div className={Styled.leftFirst}>
            <Logo />
          </div>
          <div className={Styled.leftLastChild}>
            <SidebarToggle />
          </div>
        </div>
        <ThemeToggle />
      </div>
    </header>
  )
}
