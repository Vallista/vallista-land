export interface SwitchProps {
  active: boolean
  onChange: (value: boolean) => void
  label?: string
  disabled?: boolean
  size?: SwitchSizeType
}

export type NeedSwitchProp = Partial<SwitchProps> & Pick<SwitchProps, 'active' | 'onChange'>
export type SwitchSizeType = 'small' | 'medium' | 'large'

export type ReturningUseSwitch<T extends NeedSwitchProp = NeedSwitchProp> = T & {
  size: SwitchSizeType
}
