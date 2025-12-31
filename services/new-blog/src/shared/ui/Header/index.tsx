import * as Styled from './Header.css'
import { Logo } from './Logo'
import { SidebarToggle } from './SidebarToggle'
import { ThemeToggle } from './ThemeToggle'

export const Header = () => {
  return (
    <header className={Styled.container} role='banner'>
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
