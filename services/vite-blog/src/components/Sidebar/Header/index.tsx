import { Colors, SearchInput, Text } from '@vallista/design-system'

import SidebarTagIcon from '@/assets/icons/sidebar-tag.svg?react'
import SidebarListIcon from '@/assets/icons/sidebar-list.svg?react'

import * as Styled from './index.style'
import { useHeader } from './useHeader'

interface HeaderProps {
  count: number
}

export const Header = (props: HeaderProps) => {
  const { count } = props
  const { fold } = useHeader()

  return (
    <Styled._Wrap fold={fold}>
      <Title count={count} />
      <Search />
    </Styled._Wrap>
  )
}

interface TitleProps {
  count: number
}

export const Title = (props: TitleProps) => {
  const { view, changeViewType } = useHeader()
  const { count } = props

  return (
    <Styled._Title>
      <Text size={14} weight={400}>
        글{' '}
        <Text as='span' color={Colors.PRIMARY.ACCENT_4}>
          ({count})
        </Text>
      </Text>
      <Styled._TypeButton onClick={changeViewType}>
        {view === 'TAG' ? <SidebarTagIcon /> : <SidebarListIcon />}
      </Styled._TypeButton>
    </Styled._Title>
  )
}

export const Search = () => {
  const { search, setSearch } = useHeader()

  return (
    <Styled._Search>
      <SearchInput
        value={search}
        onReset={() => setSearch('')}
        onChange={setSearch}
        size='small'
        placeholder='검색..'
      />
    </Styled._Search>
  )
}
