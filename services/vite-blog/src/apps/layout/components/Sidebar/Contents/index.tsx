import { Colors, Container, Text } from '@vallista/design-system'
import * as Styled from './index.style'

import EmptyImage from '@/assets/images/empty.svg?react'

import { SidebarContent } from '../types'
import { useContents } from './useContents'
import { Menu } from './Menu'
import { Category } from './Category'
import { Title } from './Title'
import { Search } from './Search'
import { useAgent } from '@/hooks/useAgent'

interface ContentsProps {
  count: number
  contents: SidebarContent[]
}

export const Contents = (props: ContentsProps) => {
  const { ref, count, scrollState, contents, view, taggedContents, isNowPage, moveToLocation } = useContents(props)
  const { isIOS } = useAgent()

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
      <Styled._MenuWrap>
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
      </Styled._MenuWrap>
    )

  return (
    <Styled._Wrap>
      <Styled._HeaderWrap>
        <Title count={count} />
        <Search />
      </Styled._HeaderWrap>
      {contents.length === 0 ? (
        <Styled._EmptyWrap>
          <EmptyContents />
        </Styled._EmptyWrap>
      ) : (
        <Styled._ListWrap ref={ref} scrollState={scrollState} isIos={isIOS}>
          <Styled._Padding>
            <Container>{list}</Container>
          </Styled._Padding>
        </Styled._ListWrap>
      )}
    </Styled._Wrap>
  )
}

const EmptyContents = () => {
  return (
    <Styled._EmptyContents>
      <EmptyImage width={200} height={200} />
      <Text size={14} weight={600} color={Colors.PRIMARY.ACCENT_4}>
        콘텐츠가 없어요!
      </Text>
    </Styled._EmptyContents>
  )
}
