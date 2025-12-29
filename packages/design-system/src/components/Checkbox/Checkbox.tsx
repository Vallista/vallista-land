import { CheckboxProps } from './type'
import { useCheckbox } from './useCheckbox'
import {
  checkboxBox,
  checkboxBoxChecked,
  checkboxBoxCheckedDisabled,
  checkboxBoxDisabled,
  checkboxCaption,
  checkboxCheckMarker,
  checkboxContainer,
  checkboxContent,
  checkboxIndeterminateMarker,
  checkboxInput,
  checkboxLabel,
  checkboxLabelDisabled,
  checkboxLabelFullWidth,
  checkboxLabelHover,
  checkboxLabelWithLabel,
  checkboxLabelWithoutLabel
} from './Checkbox.css'

/**
 * # Checkbox
 *
 * @description [vercel design checkbox](https://vercel.com/design/checkbox)
 *
 * 기본적인 체크박스 컴포넌트입니다. 해당 컴포넌트로 모든 체크박스를 나타냅니다.
 *
 * @param {CheckboxProps} {@link CheckboxProps} 기본적인 Checkbox 요소
 *
 * @example ```tsx
 * const [checked, setChecked] = useState(false)
 * <Checkbox checked={checked} onChange={() => setChecked(!checked)}>CheckBox</Checkbox>

 * ```
 */
export const Checkbox = (props: Partial<CheckboxProps>) => {
  const { label, marker, children, onChange, fullWidth, indeterminate, ...otherProps } = useCheckbox(props)

  const labelClasses = [
    checkboxLabel,
    label ? checkboxLabelWithLabel : checkboxLabelWithoutLabel,
    !otherProps.disabled ? checkboxLabelHover : '',
    fullWidth ? checkboxLabelFullWidth : '',
    otherProps.disabled ? checkboxLabelDisabled : ''
  ]
    .filter(Boolean)
    .join(' ')

  const boxClasses = [
    checkboxBox,
    otherProps.disabled ? checkboxBoxDisabled : '',
    otherProps.checked && !indeterminate ? checkboxBoxChecked : '',
    otherProps.checked && !indeterminate && otherProps.disabled ? checkboxBoxCheckedDisabled : ''
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div>
      <label className={labelClasses}>
        <input className={checkboxInput} type='checkbox' {...otherProps} onChange={onChange} />
        <span className={checkboxContainer}>
          <div className={boxClasses}>
            <svg viewBox='0 0 20 20' width='16' height='16' fill='none'>
              {marker === 'checked' && <path className={checkboxCheckMarker} d='M14 7L8.5 12.5L6 10'></path>}
              {marker === 'indeterminate' && (
                <line className={checkboxIndeterminateMarker} x1='5' y1='10' x2='15' y2='10'></line>
              )}
            </svg>
          </div>
          {label && <span className={checkboxCaption}>{label}</span>}
          {children && <span className={checkboxContent}>{children}</span>}
        </span>
      </label>
    </div>
  )
}
