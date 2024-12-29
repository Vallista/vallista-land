import { ReturningUseTooltip, TooltipProps } from './type'

export function useTooltip<T extends TooltipProps>(props: T): T & ReturningUseTooltip {
  const { position = 'top', type = 'primary' } = props

  return {
    ...props,
    position,
    type
  }
}
