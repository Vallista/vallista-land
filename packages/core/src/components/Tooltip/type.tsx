import { ReactNode } from 'react'

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right'
export type TooltipType = 'primary' | 'success' | 'error' | 'warning' | 'secondary'

export interface TooltipProps {
  text: ReactNode
  position?: TooltipPosition
  type?: TooltipType
}

export interface ReturningUseTooltip {
  position: TooltipPosition
  type: TooltipType
}
