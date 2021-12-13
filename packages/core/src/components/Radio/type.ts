export interface RadioProps {
  value: string
  disabled: boolean
}

export interface RadioGroupProps {
  value: string
  onChange: (value: string) => void
  disabled: boolean
  label: string
}

export interface ReturningUseRadioGroup extends Partial<RadioGroupProps> {
  value: string
  onChange: (value: string) => void
}

export type NeedRadioProp = Partial<Pick<RadioProps, 'disabled'>> & Pick<RadioProps, 'value'>
export interface ReturningUseRadio extends NeedRadioProp {
  disabled: boolean
  checked: boolean
  name: string
  onChange: (value: string) => void
}

export interface RadioContextState {
  uniqueId: string
}

export type RadioContextStateWithProps = RadioContextState & ReturningUseRadioGroup
