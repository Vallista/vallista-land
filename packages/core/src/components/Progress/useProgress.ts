import { Colors, AvailablePickedColor } from '../ThemeProvider/type'
import { ProgressProps, ReturningUseProgress } from './type'

export function useProgress<T extends Partial<ProgressProps>>(props: T): T & ReturningUseProgress {
  const {
    value = 0,
    max = 100,
    colors = { 0: Colors.PRIMARY.FOREGROUND, 100: Colors.PRIMARY.FOREGROUND },
    type = 'primary'
  } = props

  const selectKey = Object.keys(colors).find((it) => {
    return Number(it) >= value
  })
  const selectColor: AvailablePickedColor | undefined =
    selectKey && Object.keys(colors).length > 2 ? colors[selectKey] : undefined

  return {
    ...props,
    type,
    value,
    max,
    nowColor: selectColor
  }
}
