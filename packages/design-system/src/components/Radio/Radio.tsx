import { forwardRef } from 'react'

import { NeedRadioProp } from './type'
import { useRadio } from './useRadio'
import {
  radioCircle,
  radioCircleChecked,
  radioCircleDisabled,
  radioInput,
  radioLabel,
  radioLabelDisabled,
  radioText
} from './Radio.css'

/**
 * # Radio
 *
 * @description [vercel design radio](https://vercel.com/design/radio)
 *
 * 라디오 컴포넌트 입니다. {@link RadioGroup}과 같이 사용해야합니다.
 *
 * @param {RadioProps} {@link RadioProps} 기본적인 Radio 요소
 *
 * @example ```tsx
 * <Radio value='value1' />
 * <Radio value='value2' />
 * ```
 */
export const Radio = forwardRef<HTMLInputElement, NeedRadioProp>(({ children, ...props }, ref) => {
  const { onChange, checked, ...otherProps } = useRadio(props)

  return (
    <label className={`${radioLabel} ${otherProps.disabled ? radioLabelDisabled : ''}`}>
      <span
        className={`${radioCircle} ${checked ? radioCircleChecked : ''} ${otherProps.disabled ? radioCircleDisabled : ''}`}
      >
        <input className={radioInput} type='radio' ref={ref} {...otherProps} onChange={handleChange} />
      </span>
      <span className={radioText}>{children}</span>
    </label>
  )

  function handleChange(): void {
    onChange(otherProps.value)
  }
})
