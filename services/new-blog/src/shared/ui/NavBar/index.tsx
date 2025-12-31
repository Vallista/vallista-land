import * as Styled from './NavBar.css'
import { NavBarBottom } from './NavBarBottom'
import { NavBarTop } from './NavBarTop'

/**
 * 화면 좌측에 위치하는 1 Depth 네비게이션 바 영역
 */
export const NavBar = () => {
  return (
    <aside className={Styled.container} role='navigation' aria-label='Main navigation'>
      <section className={Styled.section}>
        <NavBarTop />
        <NavBarBottom />
      </section>
    </aside>
  )
}
