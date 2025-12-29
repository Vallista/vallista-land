import { style, styleVariants } from '@vanilla-extract/css'
import { recipe, RecipeVariants } from '@vanilla-extract/recipes'

// Base snippet styles
const snippetBase = style({
  position: 'relative',
  width: '100%',
  minWidth: 'fit-content',
  padding: '18px 50px 18px 18px', // 오른쪽 패딩을 60px에서 50px로 줄이고, 왼쪽 패딩을 12px에서 18px로 증가 (1.5배)
  boxSizing: 'border-box',
  borderRadius: '5px',
  border: '1px solid var(--primary-accent-1)' // GRAY_100 border 추가
})

// Snippet width variants
const snippetWidth = styleVariants({
  '300px': { minWidth: '300px' },
  '400px': { minWidth: '400px' },
  '500px': { minWidth: '500px' },
  '600px': { minWidth: '600px' },
  full: { minWidth: '100%' }
})

// Snippet type variants
const snippetType = styleVariants({
  primary: {
    background: 'transparent',
    color: 'var(--primary-foreground)'
  },
  secondary: {
    background: 'transparent',
    color: 'var(--primary-accent-5)'
  },
  success: {
    background: 'transparent',
    color: 'var(--success-default)'
  },
  error: {
    background: 'transparent',
    color: 'var(--error-default)'
  },
  warning: {
    background: 'transparent',
    color: 'var(--warning-default)'
  },
  lite: {
    background: 'transparent',
    color: 'var(--primary-foreground)'
  }
})

// Fill variants
const snippetFill = styleVariants({
  primary: {
    background: 'var(--primary-foreground)',
    border: '1px solid var(--primary-foreground)',
    color: 'var(--primary-background)'
  },
  secondary: {
    background: 'var(--primary-accent-5)',
    border: '1px solid var(--primary-accent-5)',
    color: 'var(--primary-background)'
  },
  success: {
    background: 'var(--success-default)',
    border: '1px solid var(--success-default)',
    color: 'var(--primary-background)'
  },
  error: {
    background: 'var(--error-default)',
    border: '1px solid var(--error-default)',
    color: 'var(--primary-background)'
  },
  warning: {
    background: 'var(--warning-default)',
    border: '1px solid var(--warning-default)',
    color: 'var(--primary-background)'
  },
  lite: {
    background: 'var(--primary-accent-1)',
    border: '1px solid var(--primary-accent-1)',
    color: 'var(--primary-foreground)'
  }
})

// Dark variant
const snippetDark = style({
  background: 'var(--primary-foreground)',
  border: '1px solid var(--primary-foreground)',
  color: 'var(--primary-background)'
})

const commonRow = {
  display: 'block',
  textAlign: 'left',
  margin: 0,
  fontSize: '13px',
  lineHeight: '20px',
  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
  color: 'inherit',
  width: '100%',
  wordBreak: 'break-all'
} as React.CSSProperties

// Row styles
export const snippetRow = style(commonRow)

// Copy button styles
export const snippetCopyButton = style({
  position: 'absolute',
  top: '14px',
  right: '12px',
  padding: '4px 6px',
  borderRadius: '5px',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--primary-accent-5)',
  transition: 'all 0.2s ease',
  outline: 'none',
  ':focus': {
    outline: 'none'
  },
  ':focus-visible': {
    outline: 'none'
  },
  ':active': {
    outline: 'none'
  },
  selectors: {
    '&:hover': {
      backgroundColor: 'var(--primary-accent-1)',
      color: 'var(--primary-foreground)'
    }
  }
})

// Prompt styles
export const snippetPrompt = style({
  position: 'absolute',
  top: '50%',
  left: '12px',
  transform: 'translateY(-50%)',
  color: 'var(--primary-accent-5)',
  fontSize: '12px',
  fontWeight: 500,
  userSelect: 'none'
})

export const snippet = recipe({
  base: snippetBase,
  variants: {
    width: snippetWidth,
    type: snippetType,
    fill: snippetFill,
    dark: {
      true: snippetDark
    }
  },
  defaultVariants: {
    width: '300px',
    type: 'primary',
    fill: 'primary'
  }
})

export const snippetContent = style({
  overflow: 'auto'
})

// 인라인 스타일 객체 (react-syntax-highlighter의 customStyle prop에 사용 - pre 태그용)
export const snippetSyntaxHighlighter = {
  margin: 0,
  padding: 0,
  background: 'transparent',
  overflow: 'auto'
} as const satisfies React.CSSProperties

export const snippetCodeTag = style({
  width: '100%',
  ...commonRow
})

export const snippetPreTag = style({
  margin: 0
})

export type SnippetVariants = RecipeVariants<typeof snippet>
