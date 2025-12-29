export interface SpinnerProps {
  size?: number
  'aria-label'?: string
  'aria-describedby'?: string
  'aria-live'?: 'polite' | 'assertive' | 'off'
  role?: string
}

export type ReturningUseSpinner<T extends Partial<SpinnerProps> = Partial<SpinnerProps>> = T & {
  size: number
  'aria-label': string
}
