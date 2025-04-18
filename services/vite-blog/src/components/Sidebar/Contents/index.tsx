import { Container } from '@vallista/design-system'
import * as Styled from './index.style'

import { SidebarContent } from '../types'
import { useContents } from './useContents'
import { Menu } from './Menu'
import { Category } from './Category'

interface ContentsProps {
  contents: SidebarContent[]
}

export const Contents = (props: ContentsProps) => {
  const { ref, scrollState, fold, contents, view, taggedContents, isNowPage, moveToLocation } = useContents(props)

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
    <Styled._Wrap ref={ref} fold={fold} scrollState={scrollState}>
      <Styled._Padding>
        <Container>{list}</Container>
      </Styled._Padding>
    </Styled._Wrap>
  )
}
