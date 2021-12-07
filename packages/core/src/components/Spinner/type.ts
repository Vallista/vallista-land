export interface SpinnerProps {
  size: number
}

export type ReturningUseSpinner<T extends Partial<SpinnerProps> = Partial<SpinnerProps>> = T & {
  // Element: React.ElementType
}
