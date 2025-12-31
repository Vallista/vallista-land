import { vars } from '@vallista/design-system'
import { style } from '@vanilla-extract/css'

export const container = style({
  width: '100%',
  maxWidth: '800px',
  margin: '0 auto'
})

export const title = style({
  marginBottom: vars.space[6]
})

export const form = style({
  marginBottom: vars.space[8],
  padding: vars.space[6],
  backgroundColor: vars.colors.gray[50],
  borderRadius: vars.radii.lg,
  border: `1px solid ${vars.colors.gray[200]}`
})

export const formHeader = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space[3],
  marginBottom: vars.space[4]
})

export const textarea = style({
  marginBottom: vars.space[4]
})

export const formActions = style({
  display: 'flex',
  justifyContent: 'flex-end'
})

export const commentsList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space[6]
})

export const emptyState = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: vars.space[8],
  textAlign: 'center'
})

export const commentItem = style({
  padding: vars.space[4],
  border: `1px solid ${vars.colors.gray[200]}`,
  borderRadius: vars.radii.md,
  backgroundColor: vars.colors.background
})

export const commentHeader = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space[3],
  marginBottom: vars.space[3]
})

export const commentMeta = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space[1]
})

export const commentContent = style({
  marginBottom: vars.space[3]
})

export const commentActions = style({
  display: 'flex',
  gap: vars.space[2]
})

export const replyForm = style({
  marginTop: vars.space[4],
  padding: vars.space[4],
  backgroundColor: vars.colors.gray[50],
  borderRadius: vars.radii.md,
  border: `1px solid ${vars.colors.gray[200]}`
})

export const replyTextarea = style({
  marginBottom: vars.space[3]
})

export const replyActions = style({
  display: 'flex',
  gap: vars.space[2],
  justifyContent: 'flex-end'
})

export const replies = style({
  marginTop: vars.space[4],
  marginLeft: vars.space[8],
  paddingLeft: vars.space[4],
  borderLeft: `2px solid ${vars.colors.gray[200]}`
})
