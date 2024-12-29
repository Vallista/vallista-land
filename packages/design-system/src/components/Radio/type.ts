/** 라디오 그룹 컴포넌트의 프롭 */
export interface RadioGroupProps {
  value: string
  onChange: (value: string) => void
  disabled: boolean
  label: string
  children: React.ReactNode
}

/** useRadioGroup의 반환 인터페이스 */
export interface ReturningUseRadioGroup extends Partial<RadioGroupProps> {
  value: string
  onChange: (value: string) => void
}

/** 라디오 컴포넌트의 프롭 */
export interface RadioProps {
  value: string
  disabled: boolean
}

/** partial된 RadioProps의 값과 아닌 값을 배합한 타입 */
export type NeedRadioProp = Partial<Pick<RadioProps, 'disabled'>> &
  Pick<RadioProps, 'value'> & { children: React.ReactNode }
export type UseNeedRadioProp = Partial<Pick<RadioProps, 'disabled'>> & Pick<RadioProps, 'value'>

/** useRadio의 반환 인터페이스 */
export interface ReturningUseRadio extends UseNeedRadioProp {
  disabled: boolean
  checked: boolean
  name: string
  onChange: (value: string) => void
}

/** 라디오 컨텍스트의 상태 값 */
export interface RadioContextState {
  uniqueId: string
}

/** 라디오 컨텍스트 상태와 useRadioGroup의 반환 인터페이스 */
export type RadioContextStateWithProps = RadioContextState & ReturningUseRadioGroup
