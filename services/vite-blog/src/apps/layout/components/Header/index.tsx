// import { Spacer } from '@vallista/design-system'

import * as Styled from './index.style'

import { ThemeSwitch } from './ThemeSwitch'
// import { SidebarSetting } from './SidebarSetting'
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
      {/* <Spacer />
      <SidebarSetting /> */}
    </Styled._Wrap>
  )
}
