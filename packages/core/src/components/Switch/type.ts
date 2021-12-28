export interface SwitchItem {
  name: string
  value: string
  width: number
  disabled?: boolean
}

export interface SwitchProps {
  items: SwitchItem[]
  active: string
  onChange: (value: string) => void
  size: SwitchSizeType
}

export type NeedSwitchProp = Partial<Pick<SwitchProps, 'size'>> & Pick<SwitchProps, 'active' | 'items' | 'onChange'>
export type SwitchSizeType = 'small' | 'middle' | 'large'

export type ReturningUseSwitch<T extends NeedSwitchProp = NeedSwitchProp> = T & {
  size: SwitchSizeType
}
