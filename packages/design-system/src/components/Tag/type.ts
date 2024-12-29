export interface TagProps {
  id: string
  onRemove: (id: string) => void
  children: React.ReactNode
}

export interface ReturningUseTag {
  hasRemove: boolean
}
