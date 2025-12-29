import { COLOR_TOKENS, Container, Text } from '@vallista/design-system'
import * as Styled from './index.style'

import EmptyImage from '@/assets/images/empty.svg?react'

import { SidebarContent } from '../types'
import { useContents } from './useContents'
import { Menu } from './Menu'
import { Category } from './Category'
import { Title } from './Title'
import { Search } from './Search'

interface ContentsProps {
  count: number
  contents: SidebarContent[]
}

export const Contents = (props: ContentsProps) => {
  const { ref, count, contents, view, taggedContents, isNowPage, moveToLocation } = useContents(props)

  const list =
    view === 'TAG' ? (
      Object.entries(taggedContents).map(([title, contents]) => (
        <Category key={title} title={title}>
          {contents.map((content, idx) => (
            <Menu
              key={idx}
              onClick={() => moveToLocation(content.url)}
              title={content.name}
              active={isNowPage(content.slug)}
            />
          ))}
        </Category>
      ))
    ) : (
      <nav className={Styled.menuWrap}>
        {contents.map((content, idx) => {
          return (
            <Menu
              key={idx}
              onClick={() => moveToLocation(content.url)}
              title={content.name}
              active={isNowPage(content.slug)}
            />
          )
        })}
      </nav>
    )

  return (
    <div className={Styled.wrap}>
      <div className={Styled.headerWrap}>
        <Title count={count} />
        <Search />
      </div>
      {contents.length === 0 ? (
        <div className={Styled.emptyWrap}>
          <EmptyContents />
        </div>
      ) : (
        <div className={Styled.listWrap} ref={ref}>
          <div className={Styled.padding}>
            <Container>{list}</Container>
          </div>
        </div>
      )}
    </div>
  )
}

const EmptyContents = () => {
  return (
    <div className={Styled.emptyContents}>
      <EmptyImage width={200} height={200} />
      <Text size={14} weight={600} color={COLOR_TOKENS.PRIMARY.GRAY_500}>
        콘텐츠가 없어요!
      </Text>
    </div>
  )
}
