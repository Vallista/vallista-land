type Responsive = 'column' | 'row'

export interface ContainerProps {
  row: boolean
  direction: Responsive
  gap: number
  flex: number | string
  center: boolean
  wrap: 'nowrap' | 'wrap' | 'wrap-reverse'
}
