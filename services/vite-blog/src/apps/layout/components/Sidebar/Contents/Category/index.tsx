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
    <Styled._ListStyle>
      <Styled._ListHeader onClick={() => setFold(!fold)}>
        <Styled._ListFoldIcon fold={fold}>
          {fold ? <SidebarFolderCloseIcon /> : <SidebarFolderOpenIcon />}
        </Styled._ListFoldIcon>
        <Text>{title}</Text>
      </Styled._ListHeader>
      <Styled._ListBody fold={fold}>{children}</Styled._ListBody>
    </Styled._ListStyle>
  )
}
