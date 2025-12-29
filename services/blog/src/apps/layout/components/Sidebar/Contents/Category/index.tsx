import { Text } from '@vallista/design-system'

import * as Styled from './index.style'

import SidebarFolderOpenIcon from '@/assets/icons/sidebar-folder-open.svg?react'
import SidebarFolderCloseIcon from '@/assets/icons/sidebar-folder-close.svg?react'
import { ReactNode, useState } from 'react'

interface Props {
  title: string
  children: ReactNode
}

export const Category = (props: Props) => {
  const { title, children } = props
  const [fold, setFold] = useState(false)

  return (
    <nav className={Styled.listStyle}>
      <div className={Styled.listHeader} onClick={() => setFold(!fold)}>
        <div className={fold ? Styled.listFoldIcon : `${Styled.listFoldIcon} ${Styled.listFoldIconUnfolded}`}>
          {fold ? <SidebarFolderCloseIcon /> : <SidebarFolderOpenIcon />}
        </div>
        <Text>{title}</Text>
      </div>
      <div className={fold ? Styled.listBodyFolded : Styled.listBody}>{children}</div>
    </nav>
  )
}
