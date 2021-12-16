export interface TagProps {
  id: string
  onRemove: (id: string) => void
}

export interface ReturningUseTag {
  hasRemove: boolean
}
