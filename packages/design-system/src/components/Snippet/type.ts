export type SnippetType = 'success' | 'error' | 'warning' | 'primary' | 'secondary' | 'lite'

export interface SnippetProps {
  width: string
  text: string | string[]
  dark: boolean
  prompt: boolean
  onCopy: () => void
  type: SnippetType
  fill: boolean
  language?: string
  showSyntaxHighlighting?: boolean
}

export interface ReturningUseSnippet {
  text: string[]
  handleCopy: (text: string) => void
  prompt: boolean
  type: SnippetType
}

export type SnippetMapperType = Record<SnippetType, Record<'background' | 'border' | 'color', string>>
