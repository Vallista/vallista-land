import { ProgressProps, ReturningUseProgress } from './type'

export function useProgress<T extends Partial<ProgressProps>>(props: T): T & ReturningUseProgress {
  const {
    value = 0,
    max = 100,
    colors = { 0: 'var(--primary-foreground)', 100: 'var(--primary-foreground)' },
    type = 'primary',
    width
  } = props

  const selectKey = Number(
    Object.keys(colors).find((it) => {
      return Number(it) >= value
    })
  )

  const selectColor: string | undefined =
    typeof selectKey === 'number' ? (Object.keys(colors).length > 2 ? colors[selectKey] : undefined) : undefined

  return {
    ...props,
    value,
    max,
    type,
    width,
    nowColor: selectColor
  }
}
