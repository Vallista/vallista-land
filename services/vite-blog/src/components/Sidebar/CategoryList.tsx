import { SidebarPost } from '../../types/type'
import { ViewStateType } from './Sidebar.type'
import { useState } from 'react'
import { Text } from '@vallista/design-system'
import * as Styled from './Sidebar.style'
import { PostItem } from './PostItem'

interface CategoryListProps {
  viewState: ViewStateType
  title: string
  posts: SidebarPost[]
  moveToLocation: (target: string) => void
  isNowPage: (target: string) => boolean
}

export const CategoryList = ({ posts, title, isNowPage, moveToLocation }: CategoryListProps) => {
  const [fold, setFold] = useState(!posts.find((it) => isNowPage(it.slug)))

  const handleFold = () => {
    setFold(!fold)
  }

  return (
    <Styled._ListStyle>
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
          <PostItem
            key={it.name}
            onClick={() => moveToLocation(it.slug)}
            isActive={isNowPage(it.slug)}
            slug={it.slug}
            name={it.name}
          />
        ))}
      </Styled._ListBody>
    </Styled._ListStyle>
  )
}
