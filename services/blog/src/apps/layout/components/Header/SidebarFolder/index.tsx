import HeaderSplitBtn from '@/assets/icons/header-split-btn.svg?react'

import * as Styled from './index.style'
import { useSidebarFolder } from './useSidebarFolder'

export const SidebarFolder = () => {
  const { fold, changeFold } = useSidebarFolder()

  return (
    <button className={fold ? Styled.buttonActive : Styled.button} onClick={changeFold}>
      <HeaderSplitBtn />
    </button>
  )
}
