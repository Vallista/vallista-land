import * as Styled from './index.style'

import { ThemeSwitch } from './ThemeSwitch'

import { SidebarFolder } from './SidebarFolder'
import { Logo } from './Logo'

export const Header = () => {
  return (
    <Styled._Container>
      <Styled._Wrapper>
        <Styled._Left>
          <Styled._LeftFirst />
          <Logo />
          <SidebatButtons />
        </Styled._Left>
        <ThemeSwitch />
      </Styled._Wrapper>
    </Styled._Container>
  )
}

const SidebatButtons = () => {
  return (
    <Styled._Wrap>
      <SidebarFolder />
    </Styled._Wrap>
  )
}
