import { NeedSwitchProp } from './type'
import { useSwitch } from './useSwitch'
import { switchContainer, switchTrack, switchThumb, switchLabel } from './Switch.css'

/**
 * # Switch
 *
 * @description [vercel design switch](https://vercel.com/design/switch)
 *
 * 기본적인 스위치 컴포넌트입니다. 해당 컴포넌트로 모든 스위치를 나타냅니다.
 *
 * @param {SwitchProps} {@link SwitchProps} 기본적인 Switch 요소
 *
 * @example ```tsx
 * const [active, setActive] = useState(false)
 * <Switch
 *   active={active}
 *   onChange={(value) => setActive(value)}
 *   label="Toggle switch"
 * />
 * ```
 */
export const Switch = (props: NeedSwitchProp) => {
  const { active, onChange, label, disabled = false, size = 'medium' } = useSwitch(props)

  const handleToggle = () => {
    if (!disabled) {
      onChange(!active)
    }
  }

  return (
    <div className={switchContainer()}>
      <button
        type='button'
        className={switchTrack({ size, active, disabled })}
        onClick={handleToggle}
        disabled={disabled}
        role='switch'
        aria-checked={active}
        aria-label={label}
      >
        <div className={switchThumb({ size, active, disabled })} />
      </button>
      {label && <span className={switchLabel}>{label}</span>}
    </div>
  )
}
