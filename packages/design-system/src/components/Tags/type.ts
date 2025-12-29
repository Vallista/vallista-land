export interface TagsProps {
  children: React.ReactNode
  gap?: 0 | 1 | 2 | 3 | 4 | 5
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around'
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline'
  maxWidth?: string
  minHeight?: string
}
