import { Colors, Container, Text, SearchInput } from '@vallista-land/core'
import { useEffect, useMemo, useRef, useState, VFC } from 'react'

import { SidebarPost } from '../../types/type'
import * as Styled from './Sidebar.style'
import { ViewStateType } from './Sidebar.type'
import { useSidebar } from './useSidebar'

interface SidebarProps {
  posts: SidebarPost[]
  fold: boolean
}

export const Sidebar: VFC<SidebarProps> = (props) => {
  const sidebarProps = useSidebar(props)
  const { posts, totalPosts, search, viewState, changeScrollState, changeSearch, changeLocation, isNowPage } =
    sidebarProps

  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    changeScrollState(ref.current?.scrollHeight, ref.current?.clientHeight)
  }, [search, posts, viewState])

  return (
    <aside>
      <Styled._Header {...sidebarProps}>
        <Styled._Title>
          <Text>
            글{' '}
            <Text as='span' color={Colors.PRIMARY.ACCENT_4}>
              ({totalPosts})
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
            {Object.entries(posts).map(([title, _posts]) => (
              <CategoryList
                title={title}
                posts={_posts}
                moveToLocation={moveToLocation}
                isNowPage={isNowPage}
                viewState={viewState}
              />
            ))}
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

interface CategoryListProps {
  viewState: ViewStateType
  title: string
  posts: SidebarPost[]
  moveToLocation: (target: string) => void
  isNowPage: (target: string) => boolean
}

const CategoryList: VFC<CategoryListProps> = ({ viewState, posts, title, isNowPage, moveToLocation }) => {
  const [fold, setFold] = useState(!posts.find((it) => isNowPage(it.slug)))

  const List = useMemo(() => (viewState === 'CARD' ? Styled._CardStyle : Styled._ListStyle), [viewState])
  const ListItem = useMemo(() => (viewState === 'CARD' ? Styled._CardStyleItem : Styled._ListStyleItem), [viewState])

  return (
    <List>
      <Styled._ListHeader onClick={handleFold}>
        <Text>{title}</Text>
        <Styled._ListFoldIcon fold={fold}>
          <svg
            viewBox='0 0 24 24'
            width='16'
            height='16'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeLinecap='round'
            strokeLinejoin='round'
            fill='none'
            shapeRendering='geometricPrecision'
          >
            <path d='M18 15l-6-6-6 6' />
          </svg>
        </Styled._ListFoldIcon>
      </Styled._ListHeader>
      <Styled._ListBody fold={fold}>
        {posts.map((it) => (
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
      </Styled._ListBody>
    </List>
  )

  function handleFold(): void {
    setFold(!fold)
  }
}
