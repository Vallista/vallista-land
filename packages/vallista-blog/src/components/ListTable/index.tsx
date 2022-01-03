import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { Container, Spacer, Text } from '@vallista-land/core'
import { navigate } from 'gatsby'
import { VFC } from 'react'

interface ListTableProps {
  title: string
  list: {
    name: string
    slug: string
    date: string
  }[]
}

export const ListTable: VFC<ListTableProps> = (props) => {
  const { title, list } = props

  return (
    <Container>
      <Text as='h3' size={32} weight={800}>
        {title}
      </Text>
      <Spacer y={1} />
      <List>
        {list.map((it) => (
          <ListItem key={it.slug} onClick={() => moveToLocation(it.slug)}>
            <Text as='span' size={16} weight={600}>
              {it.name}
            </Text>
            <Text as='span' size={14} weight={300}>
              {it.date}
            </Text>
          </ListItem>
        ))}
      </List>
    </Container>
  )

  function moveToLocation(target: string): void {
    navigate(target)
  }
}

const List = styled.div``

const ListItem = styled.a`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: none !important;
  border-radius: 6px;
  padding: 0.625rem 1.5rem;
  margin: 0 -1.5rem;

  ${({ theme }) => css`
    color: ${theme.colors.PRIMARY.ACCENT_6} !important;

    &:hover {
      background: ${theme.colors.PRIMARY.ACCENT_2} !important;
      color: ${theme.colors.PRIMARY.FOREGROUND} !important;
    }

    & > span:first-of-type {
      max-width: 85%;
    }

    & > span:last-of-type {
      max-width: 15%;
      white-space: nowrap;
    }

    &:last-of-type {
      color: ${theme.colors.PRIMARY.ACCENT_3};
    }
  `}
`
