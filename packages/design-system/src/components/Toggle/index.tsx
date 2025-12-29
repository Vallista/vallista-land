import { ToggleProps } from './type'
import { useToggle } from './useToggle'
import {
  toggleCircle,
  toggleCircleDisabled,
  toggleCirclePosition,
  toggleCirclePositionActive,
  toggleCircleSize,
  toggleInput,
  toggleLabel,
  toggleWrapper,
  toggleWrapperColor,
  toggleWrapperDisabled,
  toggleWrapperSize
} from './Toggle.css'

/**
 * # Toggle
 *
 * @description [vercel design toggle](https://vercel.com/design/toggle)
 *
 * 토글 컴포넌트입니다. 해당 컴포넌트로 토글을 나타냅니다.
 *
 * @param {ToggleProps} {@link ToggleProps} toggle 요소
 *
 * @example ```tsx
 * const [state, setState] = useState(false)
 *
 * <Toggle size="small" toggle={state} onChange={setState} />
 * ```
 */
export const Toggle = (props: Partial<ToggleProps>) => {
  const { size = 'small', color = 'blue', onChange, toggle, ...otherProps } = useToggle(props)

  const wrapperColor = toggle ? (color === 'blue' ? 'blue' : 'pink') : 'off'
  const circlePosition = toggle ? toggleCirclePositionActive[size] : toggleCirclePosition[size]

  return (
    <label className={toggleLabel}>
      <input
        className={toggleInput}
        type='checkbox'
        checked={toggle}
        onChange={() => onChange(!toggle)}
        {...otherProps}
      />
      <div
        className={`${toggleWrapper} ${toggleWrapperSize[size]} ${toggleWrapperColor[wrapperColor]} ${otherProps.disabled ? toggleWrapperDisabled : ''}`}
      >
        <div
          className={`${toggleCircle} ${toggleCircleSize[size]} ${circlePosition} ${otherProps.disabled ? toggleCircleDisabled : ''}`}
        />
      </div>
    </label>
  )
}
