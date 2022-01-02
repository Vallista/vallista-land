import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { Colors, Container, Text } from '@vallista-land/core'
import { VFC } from 'react'

import { SidebarPost } from '../../types/type'

interface SidebarProps {
  posts: SidebarPost[]
}

export const Sidebar: VFC<SidebarProps> = (props) => {
  const { posts } = props

  return (
    <SidebarContainer>
      <Title>
        <Text>
          글{' '}
          <Text as='span' color={Colors.PRIMARY.ACCENT_4}>
            ({posts.length} 개)
          </Text>
        </Text>
      </Title>
      <Categories>
        <Container>
          <ListStyle>
            {posts.map((it) => (
              <ListStyleItem>{it.name}</ListStyleItem>
            ))}
          </ListStyle>
        </Container>
      </Categories>
    </SidebarContainer>
  )
}

const SidebarContainer = styled.aside`
  position: fixed;
  width: 320px;
  height: 100vh;
  top: 0;
  left: 80px;
  overflow-x: hidden;
  overflow-y: hidden;

  ${({ theme }) => css`
    z-index: ${theme.layers.AFTER_STANDARD - 1};
    background: ${theme.colors.PRIMARY.ACCENT_1};
    box-shadow: ${theme.shadows.SMALL};
  `}

  @media screen and (max-width: 1000px) {
    left: -320px;
  }

  &:hover {
    overflow-y: auto;
  }

  &::-webkit-scrollbar {
    background: var(--scrollbar-background);
    height: 8px;
    width: 8px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb);
    border-radius: 0;
  }
`

const Title = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 35px;
  font-weight: 600;
  font-size: 0.85rem;
  padding: 0 0.5rem 0 2.5rem;
  position: fixed;
  top: 0;
  width: 320px;
  ${({ theme }) => css`
    z-index: ${theme.layers.AFTER_STANDARD - 2};
    background: ${theme.colors.PRIMARY.ACCENT_1};
  `}
`

const Categories = styled.div`
  margin-top: 35px;
`

const ListStyle = styled.nav`
  display: flex;
  flex-direction: column;
`

const ListStyleItem = styled.a``

const ImageStyle = styled.nav``

const ImageStyleItem = styled.a``
