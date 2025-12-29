export type ProgressType = 'primary' | 'secondary' | 'success' | 'error' | 'warning'

export interface ProgressProps {
  type: ProgressType
  value: number
  max: number
  colors: Record<number, string>
  width?: string | number
}

export interface ReturningUseProgress {
  nowColor: string | undefined
  type: ProgressType
  width?: string | number
}

export type ProgressMapperType = Record<ProgressType, Record<'background', string>>
