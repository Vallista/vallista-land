import { useRef } from 'react'

import { useMediaQuery } from '@shared/hooks/useMediaQuery'
import { usePreventScroll } from '@shared/hooks/usePreventScroll'

import * as Styled from './NavBar.css'
import { NavBarBottom } from './NavBarBottom'
import { NavBarTop } from './NavBarTop'

/**
 * 화면 좌측에 위치하는 1 Depth 네비게이션 바 영역
 */
export const NavBar = () => {
  const isMobile = useMediaQuery('(max-width: 1024px)')
  const navRef = useRef<HTMLElement>(null)
  usePreventScroll(navRef, isMobile)

  return (
    <aside ref={navRef} className={Styled.container} role='navigation' aria-label='Main navigation'>
      <section className={Styled.section}>
        <NavBarTop />
        <NavBarBottom />
      </section>
    </aside>
  )
}
