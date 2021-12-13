export interface ToggleProps {
  size: 'small' | 'medium' | 'large'
  toggle: boolean
  onChange: (active: boolean) => void
}

export interface ReturningUseToggle extends Partial<ToggleProps> {
  toggle: boolean
  onChange: (active: boolean) => void
}

export type StyleParams = Pick<ToggleProps, 'size' | 'toggle'>
