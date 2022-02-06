import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { useLocation } from '@reach/router'
import { Colors, Container, Text, SearchInput } from '@vallista-land/core'
import { navigate } from 'gatsby'
import { useEffect, useMemo, useRef, useState, VFC } from 'react'

import { SidebarPost } from '../../types/type'
import { localStorage } from '../../utils'

interface SidebarProps {
  posts: SidebarPost[]
  fold: boolean
}

export const Sidebar: VFC<SidebarProps> = (props) => {
  const location = useLocation()
  const { posts, fold } = props
  const [search, setSearch] = useState(() => {
    if (typeof window === 'undefined') return ''

    return localStorage.get('search') || ''
  })
  const [viewType, setViewType] = useState<'list' | 'card'>(() => {
    if (typeof window === 'undefined') return 'card'
    return (localStorage.get('view-type') as 'list' | 'card') || 'card'
  })
  const ref = useRef<HTMLDivElement>(null)
  const [hasVerticalScrollbar, setHasVerticalScrollbar] = useState(false)

  const filteredPosts = useMemo(
    () => posts.filter((it) => it.name.toLocaleUpperCase().includes(search.toLocaleUpperCase())),
    [search, posts]
  )

  useEffect(() => {
    setHasVerticalScrollbar((ref.current?.scrollHeight ?? 0) > (ref.current?.clientHeight ?? 0))
  }, [search, posts, viewType])

  const List = useMemo(() => (viewType === 'card' ? CardStyle : ListStyle), [viewType])
  const ListItem = useMemo(() => (viewType === 'card' ? CardStyleItem : ListStyleItem), [viewType])

  return (
    <aside>
      <Header hasVerticalScrollbar={hasVerticalScrollbar} fold={fold}>
        <Title>
          <Text>
            글{' '}
            <Text as='span' color={Colors.PRIMARY.ACCENT_4}>
              ({posts.length})
            </Text>
          </Text>
          <Button onClick={handleChangeViewType}>
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
          </Button>
        </Title>
        <SearchBox>
          <SearchInput value={search} onReset={searchClear} onChange={handleInput} size='small' placeholder='검색..' />
        </SearchBox>
      </Header>
      <SidebarContainer ref={ref} hasVerticalScrollbar={hasVerticalScrollbar} fold={fold}>
        <Categories>
          <Container>
            <List>
              {filteredPosts.map((it) => (
                <ListItem
                  key={it.name}
                  onClick={() => moveToLocation(it.slug)}
                  image={it.image}
                  text={it.name}
                  isActive={isActive(it.slug)}
                >
                  <div>
                    {viewType === 'list' && (
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
                    )}
                  </div>
                  {viewType === 'list' && <Text>{it.name}</Text>}
                </ListItem>
              ))}
            </List>
          </Container>
        </Categories>
      </SidebarContainer>
    </aside>
  )

  function moveToLocation(target: string): void {
    navigate(target)
  }

  function handleInput(target: string): void {
    setSearch(target)
    localStorage.set('search', target)
  }

  function searchClear(): void {
    setSearch('')
    localStorage.set('search', '')
  }

  function handleChangeViewType(): void {
    const type = viewType === 'card' ? 'list' : 'card'
    localStorage.set('view-type', type)
    setViewType(type)
  }

  function isActive(target: string): boolean {
    return decodeURIComponent(location.pathname).includes(target.slice(0, -1))
  }
}

const SidebarContainer = styled.div<{ hasVerticalScrollbar: boolean; fold: boolean }>`
  position: fixed;
  width: 320px;
  height: 100vh;
  top: 0;
  left: 80px;
  overflow-x: hidden;
  overflow-y: hidden;

  ${({ theme, hasVerticalScrollbar, fold }) => css`
    z-index: ${theme.layers.AFTER_STANDARD - 1};
    background: ${theme.colors.PRIMARY.ACCENT_1};
    box-shadow: ${theme.shadows.SMALL};

    ${hasVerticalScrollbar &&
    css`
      &:hover > div:last-of-type {
        margin-right: -8px;
      }
    `}

    ${fold &&
    css`
      left: -320px;

      & > div:first-of-type {
        left: -320px;
      }
    `}

    /* ipad Portrait and Landscape */
    @media only screen and (min-device-width: 768px) and (max-device-width: 1024px) {
      overflow-y: auto;

      ${hasVerticalScrollbar &&
      css`
        &:hover > div:last-of-type {
          margin-right: 0;
        }
      `}
    }
  `}

  @media screen and (max-width: 1024px) {
    left: -320px;

    & > div:first-of-type {
      left: -320px;
    }
  }

  &:hover {
    overflow-y: auto;
  }

  /** 파이어폭스 스크롤 대응 */
  scrollbar-width: 8px;
  // thumb background 순
  scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-background);

  /** 사파리 크롬 스크롤 대응 */
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

const Header = styled.div<{ hasVerticalScrollbar: boolean; fold: boolean }>`
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 80px;
  transform: translate3d(0, 0, 1);
  width: 320px;
  padding-bottom: 14px;

  ${({ theme, fold }) => css`
    z-index: ${theme.layers.AFTER_STANDARD};
    background: ${theme.colors.PRIMARY.ACCENT_1};

    ${fold &&
    css`
      left: -320px;

      & > div:first-of-type {
        left: -320px;
      }
    `}
  `}

  @media screen and (max-width: 1024px) {
    left: -320px;

    & > div:first-of-type {
      left: -320px;
    }
  }
`

const Button = styled.button`
  border: none;
  background: none;
  outline: none;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s cubic-bezier(0.215, 0.61, 0.355, 1);

  ${({ theme }) => css`
    color: ${theme.colors.PRIMARY.ACCENT_4};
    &:hover {
      color: ${theme.colors.PRIMARY.FOREGROUND};
    }
  `}
`

const Title = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 35px;
  font-weight: 600;
  font-size: 14px;
  padding: 0 28px 2px;

  & > button {
    margin: 0;
  }
`

const SearchBox = styled.div`
  display: flex;
  align-items: flex-end;
  height: 38px;
  padding: 0 24px;
  max-width: 100%;

  & > div {
    width: 100%;
  }
`

const Categories = styled.div`
  margin-top: 73px;
  padding: 16px 24px 32px;
`

const CardStyle = styled.nav`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
`

const CardStyleItem = styled.a<{ image: string | null; text: string; isActive: boolean }>`
  position: relative;
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
  width: 130px;
  height: 130px;
  margin-bottom: 12px;
  border-radius: 12px;
  cursor: pointer;
  overflow: hidden;
  transform: scale(1, 1);
  transition: transform 0.2s cubic-bezier(0.075, 0.82, 0.165, 1);

  ${({ theme, image, text, isActive }) => css`
    background-image: url(${image});
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center;
    box-shadow: ${theme.shadows.SMALL};
    color: ${theme.colors.PRIMARY.BACKGROUND};

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      width: inherit;
      height: inherit;
      background: ${isActive ? theme.colors.HIGHLIGHT.PINK : theme.colors.PRIMARY.FOREGROUND};
      opacity: ${isActive ? 0.5 : 0.3};
      border-radius: 12px;
    }

    &::after {
      content: '${text}';
      position: absolute;
      right: 0;
      bottom: 0;
      font-size: 16px;
      font-weight: 600;
      line-height: 1.1;
      color: ${theme.colors.PRIMARY.BACKGROUND};
      text-align: right;
      margin: 6px 6px 12px;
      word-break: keep-all;
      letter-spacing: -0.02rem;
    }
  `}

  &:hover {
    transform: scale(1.1, 1.1);
  }
`

const ListStyle = styled.nav`
  display: flex;
  flex-direction: column;
`

const ListStyleItem = styled.a<{ isActive: boolean }>`
  position: relative;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  cursor: pointer;
  padding: 6px 12px;
  margin: 0 -12px;
  border-radius: 6px;
  transition: border 0.2s ease;

  ${({ theme, isActive }) => css`
    ${isActive &&
    css`
      border-left: 6px solid ${theme.colors.HIGHLIGHT.PINK};
      padding-left: 12px;
    `};

    & > div {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-right: 6px;
      color: ${theme.colors.PRIMARY.ACCENT_4};
    }

    &:hover {
      background-color: ${theme.colors.PRIMARY.ACCENT_2};
    }

    /* &::before {
      content: '';
      transform: translateY(-50%);
      
      font-size: 1rem;
    } */
  `}

  & > svg {
    width: 20px;
    height: 20px;
  }
`
