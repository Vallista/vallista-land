import HeaderSplitBtn from '@/assets/icons/header-split-btn.svg?react'

import * as Styled from './index.style'
import { useSidebarFolder } from './useSidebarFolder'

export const SidebarFolder = () => {
  const { fold, changeFold } = useSidebarFolder()

  return (
    <Styled._Button fold={fold} onClick={changeFold}>
      <HeaderSplitBtn />
    </Styled._Button>
  )
}
