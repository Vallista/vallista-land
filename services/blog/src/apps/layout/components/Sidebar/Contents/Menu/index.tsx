import * as Styled from './index.style'
import { Text } from '@vallista/design-system'

import SidebarFileIcon from '@/assets/icons/sidebar-file.svg?react'

interface Props {
  title: string
  active: boolean
  onClick: () => void
}

export const Menu = (props: Props) => {
  const { title, active, onClick } = props

  return (
    <a className={active ? Styled.menuActive : Styled.menu} onClick={onClick}>
      <SidebarFileIcon />
      <Text as='span' textWrap={false}>
        {title}
      </Text>
    </a>
  )
}
