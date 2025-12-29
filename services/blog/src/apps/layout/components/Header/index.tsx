import * as Styled from './index.style'

import { ThemeSwitch } from './ThemeSwitch'

import { SidebarFolder } from './SidebarFolder'
import { Logo } from './Logo'

export const Header = () => {
  return (
    <header className={Styled.container} role='banner'>
      <div className={Styled.wrapper}>
        <div className={Styled.left}>
          <div className={Styled.leftFirst} />
          <Logo />
          <SidebatButtons />
        </div>
        <ThemeSwitch />
      </div>
    </header>
  )
}

const SidebatButtons = () => {
  return (
    <div className={Styled.wrap}>
      <SidebarFolder />
    </div>
  )
}
