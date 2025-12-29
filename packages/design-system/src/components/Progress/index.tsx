import { ProgressProps } from './type'
import { useProgress } from './useProgress'
import { progress, customProgress } from './Progress.css'

/**
 * # Progress
 *
 * 진행상황을 쉽게 컨트롤 할 때 사용하세요.
 *
 * @param {ProgressProps} {@link ProgressProps}
 *
 * @example ```tsx
 * const [value, setValue] = useState(0)
 * 
  <Progress
    value={value}
    width="300px"
    colors={{
      0: Colors.PRIMARY.FOREGROUND,
      25: Colors.PRIMARY.ACCENT_5,
      50: Colors.WARNING.DEFAULT,
      75: Colors.HIGHLIGHT.PINK,
      100: Colors.SUCCESS.DEFAULT
    }}
  />
  <Button
    onClick={() => {
      if (value < 100) setValue(value + 10)
    }}
    size='medium'
  >
    Increase
  </Button>

  <Button
    onClick={() => {
      if (value > 0) setValue(value - 10)
    }}
    color='secondary'
  >
    Decrease
  </Button>
 * ```
 */
export const Progress = (props: Partial<ProgressProps>) => {
  const { type = 'primary', nowColor, width, ...otherProps } = useProgress(props)

  const progressClass = nowColor ? customProgress({ type }) : progress({ type })

  return (
    <progress
      className={progressClass}
      style={{
        width: width || '100%',
        ...(nowColor ? { '--progress-color': nowColor } : {})
      }}
      {...otherProps}
    />
  )
}
