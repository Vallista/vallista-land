export interface ToggleProps {
  disabled: boolean
  size: 'small' | 'medium' | 'large'
  toggle: boolean
  onChange: (active: boolean) => void
  color: 'blue' | 'pink'
}

export interface ReturningUseToggle extends Partial<ToggleProps> {
  toggle: boolean
  onChange: (active: boolean) => void
}

export type StyleParams = Partial<Pick<ToggleProps, 'disabled'>> & Pick<ToggleProps, 'size' | 'toggle' | 'color'>
