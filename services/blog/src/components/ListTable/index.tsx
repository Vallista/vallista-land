import { Container, Spacer, Text } from '@vallista/core'
import { navigate } from 'gatsby'
import { VFC } from 'react'

import * as Styled from './ListTable.style'

interface ListTableProps {
  title: string
  list: {
    name: string
    slug: string
    date: string
  }[]
  underline?: boolean
}

export const ListTable: VFC<ListTableProps> = (props) => {
  const { title, list, underline = false } = props

  return (
    <Container>
      <Styled._TitleWrapper underline={underline}>
        <Text as='h3' size={32} weight={800}>
          {title}
        </Text>
      </Styled._TitleWrapper>
      <Spacer y={1} />
      <Styled._List>
        {list.map((it) => (
          <Styled._ListItem key={it.slug} onClick={() => moveToLocation(it.slug)}>
            <Text as='span' size={16} weight={600}>
              {it.name}
            </Text>
            <Text as='span' size={14} weight={300}>
              {it.date}
            </Text>
          </Styled._ListItem>
        ))}
      </Styled._List>
    </Container>
  )

  function moveToLocation(target: string): void {
    navigate(target)
  }
}
