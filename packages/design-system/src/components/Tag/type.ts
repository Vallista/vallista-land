export interface TagProps {
  id?: string
  onRemove?: (id: string) => void
  children: React.ReactNode
  hasRemove?: boolean
}

export interface ReturningUseTag {
  hasRemove: boolean
}
