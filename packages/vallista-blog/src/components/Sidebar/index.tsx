import { Colors, Container, Text, SearchInput } from '@vallista-land/core'
import { useEffect, useMemo, useRef, VFC } from 'react'

import { SidebarPost } from '../../types/type'
import * as Styled from './Sidebar.style'
import { useSidebar } from './useSidebar'

interface SidebarProps {
  posts: SidebarPost[]
  fold: boolean
}

export const Sidebar: VFC<SidebarProps> = (props) => {
  const sidebarProps = useSidebar(props)
  const {
    posts,
    // fold,
    search,
    // scrollState,
    viewState,
    changeScrollState,
    // changeViewState,
    changeSearch,
    changeLocation,
    isNowPage
  } = sidebarProps

  const ref = useRef<HTMLDivElement>(null)

  const filteredPosts = useMemo(
    () => posts.filter((it) => it.name.toLocaleUpperCase().includes(search.toLocaleUpperCase())),
    [search, posts]
  )

  useEffect(() => {
    changeScrollState(ref.current?.scrollHeight, ref.current?.clientHeight)
  }, [search, posts, viewState])

  const List = useMemo(() => (viewState === 'CARD' ? Styled._CardStyle : Styled._ListStyle), [viewState])
  const ListItem = useMemo(() => (viewState === 'CARD' ? Styled._CardStyleItem : Styled._ListStyleItem), [viewState])

  return (
    <aside>
      <Styled._Header {...sidebarProps}>
        <Styled._Title>
          <Text>
            글{' '}
            <Text as='span' color={Colors.PRIMARY.ACCENT_4}>
              ({posts.length})
            </Text>
          </Text>
          {/* <Button onClick={handleChangeViewType}>
            {viewType === 'card' ? (
              <svg
                viewBox='0 0 24 24'
                width='20'
                height='20'
                stroke='currentColor'
                strokeWidth='1.5'
                strokeLinecap='round'
                strokeLinejoin='round'
                fill='none'
                shapeRendering='geometricPrecision'
              >
                <path d='M21 10H3' />
                <path d='M21 6H3' />
                <path d='M21 14H3' />
                <path d='M21 18H3' />
              </svg>
            ) : (
              <svg
                viewBox='0 0 24 24'
                width='20'
                height='20'
                stroke='currentColor'
                strokeWidth='1.5'
                strokeLinecap='round'
                strokeLinejoin='round'
                fill='none'
                shapeRendering='geometricPrecision'
              >
                <rect x='1' y='4' width='20' height='16' rx='2' ry='2' />
                <path d='M1 10h20' />
              </svg>
            )}
          </Button> */}
        </Styled._Title>
        <Styled._SearchBox>
          <SearchInput value={search} onReset={searchClear} onChange={handleInput} size='small' placeholder='검색..' />
        </Styled._SearchBox>
      </Styled._Header>
      <Styled._SidebarContainer ref={ref} {...sidebarProps}>
        <Styled._Categories>
          <Container>
            <List>
              {filteredPosts.map((it) => (
                <ListItem
                  key={it.name}
                  onClick={() => moveToLocation(it.slug)}
                  image={it.image}
                  text={it.name}
                  isActive={isNowPage(it.slug)}
                >
                  {viewState === 'LIST' && (
                    <>
                      <div>
                        <svg
                          viewBox='0 0 24 24'
                          width='20'
                          height='20'
                          stroke='currentColor'
                          strokeWidth='1.5'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          fill='none'
                          shapeRendering='geometricPrecision'
                        >
                          <path d='M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z' />
                          <path d='M13 2v7h7' />
                        </svg>
                      </div>
                      <Text>{it.name}</Text>
                    </>
                  )}
                </ListItem>
              ))}
            </List>
          </Container>
        </Styled._Categories>
      </Styled._SidebarContainer>
    </aside>
  )

  function moveToLocation(target: string): void {
    changeLocation(target)
  }

  function handleInput(target: string): void {
    changeSearch(target)
  }

  function searchClear(): void {
    changeSearch('')
  }
}
