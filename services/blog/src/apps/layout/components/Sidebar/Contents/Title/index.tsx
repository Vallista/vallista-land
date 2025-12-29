import { COLOR_TOKENS, Text } from '@vallista/design-system'

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
    <div className={Styled.title}>
      <div className={Styled.titleWrap}>
        <div className={Styled.titleBox}>
          <Text as='span' size={14} weight={400}>
            {text}
          </Text>
          <Text as='span' size={14} weight={400} color={COLOR_TOKENS.PRIMARY.GRAY_500}>
            ({count})
          </Text>
        </div>
        <button className={Styled.typeButton} onClick={changeViewType}>
          {view === 'TAG' ? <SidebarTagIcon /> : <SidebarListIcon />}
        </button>
      </div>
    </div>
  )
}
