import { AvailablePickedColor } from '../ThemeProvider/type'

export type ProgressType = 'primary' | 'secondary' | 'success' | 'error' | 'warning'

export interface ProgressProps {
  type: ProgressType
  value: number
  max: number
  colors: Record<number, AvailablePickedColor>
}

export interface ReturningUseProgress {
  nowColor: AvailablePickedColor | undefined
  type: ProgressType
}

export type ProgressMapperType = Record<ProgressType, Record<'background', AvailablePickedColor>>
