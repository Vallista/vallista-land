import { vars } from '@vallista/design-system'
import { style, globalStyle } from '@vanilla-extract/css'

export const container = style({
  width: '100%',
  maxWidth: '100%',
  lineHeight: 1.8,
  color: vars.colors.text
})

export const firstChild = style({
  marginTop: 0
})

export const lastChild = style({
  marginBottom: 0
})

// 제목 스타일
export const h1 = style({
  fontSize: '2.5rem',
  fontWeight: 'bold',
  marginTop: vars.space[12],
  marginBottom: vars.space[6],
  lineHeight: 1.2,
  color: vars.colors.text
})

export const h2 = style({
  fontSize: '2rem',
  fontWeight: 'bold',
  marginTop: vars.space[10],
  marginBottom: vars.space[4],
  lineHeight: 1.3,
  color: vars.colors.text
})

export const h3 = style({
  fontSize: '1.5rem',
  fontWeight: 'bold',
  marginTop: vars.space[8],
  marginBottom: vars.space[3],
  lineHeight: 1.4,
  color: vars.colors.text
})

export const h4 = style({
  fontSize: '1.25rem',
  fontWeight: 'bold',
  marginTop: vars.space[6],
  marginBottom: vars.space[2],
  lineHeight: 1.4,
  color: vars.colors.text
})

export const h5 = style({
  fontSize: '1.125rem',
  fontWeight: 'bold',
  marginTop: vars.space[4],
  marginBottom: vars.space[2],
  lineHeight: 1.4,
  color: vars.colors.text
})

export const h6 = style({
  fontSize: '1rem',
  fontWeight: 'bold',
  marginTop: vars.space[4],
  marginBottom: vars.space[2],
  lineHeight: 1.4,
  color: vars.colors.text
})

// 단락
export const p = style({
  marginBottom: vars.space[4],
  lineHeight: 1.8
})

// 링크
export const link = style({
  color: vars.colors.primary,
  textDecoration: 'none',
  borderBottom: `1px solid ${vars.colors.primary}`,
  transition: 'all 0.2s ease',

  ':hover': {
    color: vars.colors.primaryDark,
    borderBottomColor: vars.colors.primaryDark
  }
})

// 이미지
export const image = style({
  maxWidth: '100%',
  height: 'auto',
  borderRadius: vars.radii.md,
  margin: `${vars.space[4]} 0`,
  boxShadow: vars.shadows.md
})

// 인용구
export const blockquote = style({
  borderLeft: `4px solid ${vars.colors.primary}`,
  paddingLeft: vars.space[4],
  margin: `${vars.space[6]} 0`,
  fontStyle: 'italic',
  backgroundColor: 'unset',
  color: 'inherit',
  padding: vars.space[4],
  paddingTop: 0,
  paddingBottom: 0
})

globalStyle(`${blockquote} > :first-child`, {
  marginTop: 0
})

globalStyle(`${blockquote} > :last-child`, {
  marginBottom: 0
})

// 코드 블록
export const codeBlockWrapper = style({
  margin: `${vars.space[4]} 0`
})

export const inlineCodeWrapper = style({
  overflow: 'auto'
})

// 인라인 코드
export const inlineCode = style({
  color: 'inherit',
  padding: `${vars.space[1]} ${vars.space[2]}`,
  borderRadius: vars.radii.md,
  fontSize: '0.875em',
  fontFamily: vars.fonts.mono,
  fontWeight: 500,
  background: vars.colors.gray[100]
})

// 테이블
export const tableWrapper = style({
  overflowX: 'auto',
  margin: `${vars.space[4]} 0`
})

export const table = style({
  width: '100%',
  borderCollapse: 'collapse',
  margin: `${vars.space[4]} 0`
})

export const tableHeader = style({
  padding: vars.space[2],
  textAlign: 'left',
  borderBottom: `1px solid ${vars.colors.gray[200]}`,
  fontWeight: 'bold',
  backgroundColor: vars.colors.gray[50],
  color: vars.colors.gray[800]
})

export const tableCell = style({
  padding: vars.space[2],
  textAlign: 'left',
  borderBottom: `1px solid ${vars.colors.gray[200]}`
})

export const tableRow = style({
  ':hover': {
    backgroundColor: vars.colors.gray[50]
  }
})

// 리스트
export const ul = style({
  paddingLeft: vars.space[6],
  marginBottom: vars.space[4],
  listStyle: 'disc'
})

export const ol = style({
  paddingLeft: vars.space[6],
  marginBottom: vars.space[4],
  listStyle: 'decimal'
})

export const li = style({
  marginBottom: vars.space[1],
  lineHeight: 1.6
})

// 강조
export const strong = style({
  fontWeight: 'bold',
  color: vars.colors.text
})

export const em = style({
  fontStyle: 'italic',
  color: vars.colors.text
})

// 구분선
export const hr = style({
  border: 'none',
  borderTop: `1px solid ${vars.colors.gray[200]}`,
  margin: `${vars.space[8]} 0`
})

// 특별한 스타일
export const center = style({
  textAlign: 'center'
})

// 체크박스 리스트
export const taskList = style({
  listStyle: 'none',
  paddingLeft: 0
})

export const taskItem = style({
  display: 'flex',
  alignItems: 'center',
  marginBottom: vars.space[1]
})

export const taskCheckbox = style({
  marginRight: vars.space[2]
})
