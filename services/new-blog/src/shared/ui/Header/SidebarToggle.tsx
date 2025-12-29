import { useSidebar } from '@shared/context/SidebarContext'
import HeaderSplitBtn from '@/assets/icons/header-split-btn.svg?react'
import * as Styled from './Header.css'

export const SidebarToggle = () => {
  const { toggle, isOpen } = useSidebar()

  return (
    <button onClick={toggle} className={Styled.sidebarToggle} title='사이드바 토글'>
      <HeaderSplitBtn className={isOpen ? Styled.defaultIcon : Styled.activeIcon} />
    </button>
  )
}
