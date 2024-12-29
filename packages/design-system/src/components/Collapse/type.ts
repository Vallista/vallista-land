export type CollapseSizeType = 'small' | 'medium'

export interface CollapseProps {
  title: string
  subtitle: string
  defaultExpanded: boolean
  size: CollapseSizeType
  card: boolean
  children: React.ReactNode
}

export interface ReturningUseCollapse {
  expanded: boolean
  fold: () => void
}
