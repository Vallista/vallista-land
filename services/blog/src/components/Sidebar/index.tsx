import { Colors, Container, Text, SearchInput, Button } from '@vallista/design-system'
import { useEffect, useRef, FC } from 'react'

import { SidebarPost } from '../../types/type'
import * as Styled from './Sidebar.style'
import { useSidebar } from './useSidebar'

import { CategoryList } from './CategoryList'
import { PostItem } from './PostItem'

interface SidebarProps {
  posts: SidebarPost[]
  fold: boolean
}

export const Sidebar: FC<SidebarProps> = (props) => {
  const sidebarProps = useSidebar(props)
  const {
    posts,
    taggedPosts,
    totalPosts,
    search,
    viewState,
    changeScrollState,
    changeSearch,
    changeLocation,
    isNowPage,
    changeViewState
  } = sidebarProps

  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    changeScrollState(ref.current?.scrollHeight, ref.current?.clientHeight)
  }, [search, posts, viewState])

  const postViews =
    viewState === 'TAGS'
      ? Object.entries(taggedPosts).map(([title, _posts]) => (
          <CategoryList
            title={title}
            posts={_posts}
            moveToLocation={moveToLocation}
            isNowPage={isNowPage}
            viewState={viewState}
          />
        ))
      : posts.map((it) => (
          <PostItem
            key={it.slug}
            name={it.name}
            isActive={isNowPage(it.slug)}
            slug={it.slug}
            onClick={() => moveToLocation(it.slug)}
          />
        ))

  return (
    <aside>
      <Styled._Header {...sidebarProps}>
        <Styled._Title>
          <Text size={14} weight={400}>
            글{' '}
            <Text as='span' color={Colors.PRIMARY.ACCENT_4}>
              ({totalPosts})
            </Text>
          </Text>
          <Styled._ChangeListButton onClick={handleChangeViewType}>
            {viewState === 'TAGS' ? (
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
          </Styled._ChangeListButton>
        </Styled._Title>
        <Styled._SearchBox>
          <SearchInput value={search} onReset={searchClear} onChange={handleInput} size='small' placeholder='검색..' />
        </Styled._SearchBox>
      </Styled._Header>
      <Styled._SidebarContainer ref={ref} {...sidebarProps}>
        <Styled._Categories>
          <Container>{postViews}</Container>
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

  function handleChangeViewType(): void {
    changeViewState(viewState === 'LIST' ? 'TAGS' : 'LIST')
  }
}
