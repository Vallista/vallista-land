import { Colors, Container, Text, SearchInput } from '@vallista/core'
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
        <Styled._ListFoldIcon fold={fold}>
          {fold ? (
            <div style={{ width: '24px', height: '16px' }}>
              <svg width='16' height='16' viewBox='0 0 32 32' stroke='currentColor'>
                <g>
                  <g>
                    <path d='M17,9 L15,5 L4.00276013,5 C2.89666625,5 2,5.88967395 2,6.991155 L2,25.008845 C2,26.1085295 2.89971268,27 3.99328744,27 L29.0067126,27 C30.1075748,27 31,26.1073772 31,25.0049107 L31,10.9950893 C31,9.8932319 30.1029399,9 28.9941413,9 L17,9 L17,9 Z M16.3599854,10 L14.4000244,6 L3.99173483,6 C3.44401481,6 3,6.45530558 3,6.99180311 L3,25.0081969 C3,25.5559546 3.44610862,26 3.99296544,26 L29.0070346,26 C29.5554342,26 30,25.5553691 30,24.9991283 L30,11.0008717 C30,10.4481055 29.5461723,10 28.9970172,10 L16.3599854,10 L16.3599854,10 Z' />
                  </g>
                </g>
              </svg>
            </div>
          ) : (
            <div style={{ width: '24px', height: '16px' }}>
              <svg width='20' height='20' viewBox='0 0 100 100' stroke='currentColor'>
                <path
                  fill='currentColor'
                  d='M97.197,40.597C96.914,40.221,96.47,40,96,40h-8.5v-9.327c0-0.828-0.671-1.499-1.498-1.5l-44.407-0.055l-7.179-7.179
	c-0.281-0.281-0.663-0.439-1.061-0.439H12c-0.828,0-1.5,0.672-1.5,1.5v54c0,0.828,0.672,1.5,1.5,1.5h73.795
	c0.731,0,1.339-0.525,1.472-1.218c0.071-0.115,0.137-0.234,0.176-0.37l10-35C97.571,41.46,97.481,40.973,97.197,40.597z
	 M32.734,24.5l7.178,7.178c0.28,0.281,0.661,0.438,1.059,0.439L84.5,32.171V40H22c-0.67,0-1.258,0.444-1.442,1.088L13.5,65.79V24.5
	H32.734z M84.726,75.5h-70.88L23.132,43h70.88L84.726,75.5z'
                />
              </svg>
            </div>
          )}
        </Styled._ListFoldIcon>
        <Text>{title}</Text>
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
