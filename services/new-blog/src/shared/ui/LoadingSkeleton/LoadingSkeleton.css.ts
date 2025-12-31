import { COLOR_TOKENS } from '@vallista/design-system'
import { style, keyframes } from '@vanilla-extract/css'

// 스켈레톤 애니메이션 스타일
const skeletonStyle = {
  background: `linear-gradient(90deg, ${COLOR_TOKENS.PRIMARY.GRAY_300} 25%, ${COLOR_TOKENS.PRIMARY.GRAY_400} 50%, ${COLOR_TOKENS.PRIMARY.GRAY_300} 75%)`,
  backgroundSize: '200% 100%',
  animation: 'loading 1.5s infinite'
}

// CSS 애니메이션 정의
const loadingKeyframes = keyframes({
  '0%': { backgroundPosition: '200% 0' },
  '100%': { backgroundPosition: '-200% 0' }
})

export const loadingAnimation = style({
  animation: `${loadingKeyframes} 1.5s infinite`
})

// 아티클 헤더 스켈레톤
export const articleHeaderSkeleton = {
  wrap: style({
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '800px',
    padding: 'calc(64px + 24px + 32px) 16px 0',
    fontSize: '16px',
    '@media': {
      'screen and (min-width: 1025px)': {
        width: '800px',
        padding: 'calc(64px + 24px + 32px) 24px 0'
      },
      'screen and (max-width: 1024px)': {
        width: '100%',
        padding: '40px 24px 60px'
      }
    }
  }),
  titleIcon: style({
    width: '36px',
    height: '36px',
    marginBottom: '24px',
    borderRadius: '4px',
    ...skeletonStyle,
    '@media': {
      'screen and (max-width: 1024px)': {
        width: '36px',
        height: '36px',
        marginBottom: '24px'
      }
    }
  }),
  title: style({
    height: '120px',
    marginBottom: '16px',
    borderRadius: '4px',
    ...skeletonStyle
  }),
  date: style({
    height: '0.875em',
    width: '120px',
    marginBottom: '16px',
    borderRadius: '4px',
    ...skeletonStyle
  }),
  tags: style({
    display: 'flex',
    gap: '8px',
    marginBottom: '24px'
  }),
  tag: style({
    width: '60px',
    height: '24px',
    borderRadius: '12px',
    ...skeletonStyle
  })
}

export const articleCardSkeleton = {
  card: style({
    display: 'flex',
    flexDirection: 'column',
    padding: '16px',
    border: `1px solid ${COLOR_TOKENS.PRIMARY.GRAY_100}`,
    borderRadius: '8px',
    backgroundColor: COLOR_TOKENS.PRIMARY.WHITE,
    transition: 'all 0.2s ease',
    textDecoration: 'none',
    color: 'inherit',
    gap: '12px'
  }),
  image: style({
    width: '100%',
    height: '200px',
    borderRadius: '8px',
    ...skeletonStyle
  }),
  content: style({
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  }),
  meta: style({
    height: '14px',
    width: '80px',
    borderRadius: '4px',
    ...skeletonStyle
  }),
  title: style({
    height: '24px',
    width: '100%',
    borderRadius: '4px',
    ...skeletonStyle
  }),
  description: style({
    height: '16px',
    width: '90%',
    borderRadius: '4px',
    ...skeletonStyle
  }),
  tags: style({
    display: 'flex',
    gap: '4px'
  }),
  tag: style({
    width: '40px',
    height: '20px',
    borderRadius: '10px',
    ...skeletonStyle
  })
}

export const sidebarMenuSkeleton = {
  container: style({
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  }),
  item: style({
    height: '32px',
    width: '100%',
    borderRadius: '4px',
    ...skeletonStyle
  })
}
