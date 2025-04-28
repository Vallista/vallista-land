import { Colors, Text } from '@vallista/design-system'

import SidebarTagIcon from '@/assets/icons/sidebar-tag.svg?react'
import SidebarListIcon from '@/assets/icons/sidebar-list.svg?react'

import { useTitle } from './useTitle'
import * as Styled from './index.style'

interface TitleProps {
  count: number
}

export const Title = (props: TitleProps) => {
  const { view, text, changeViewType } = useTitle()
  const { count } = props

  return (
    <Styled._Title>
      <Styled._TitleWrap>
        <Styled._TitleBox>
          <Text as='span' size={14} weight={400}>
            {text}
          </Text>
          <Text as='span' size={14} weight={400} color={Colors.PRIMARY.ACCENT_4}>
            ({count})
          </Text>
        </Styled._TitleBox>
        <Styled._TypeButton onClick={changeViewType}>
          {view === 'TAG' ? <SidebarTagIcon /> : <SidebarListIcon />}
        </Styled._TypeButton>
      </Styled._TitleWrap>
    </Styled._Title>
  )
}
