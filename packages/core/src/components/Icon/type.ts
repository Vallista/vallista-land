import React from 'react'

import { AvailablePickedColor } from '../ThemeProvider/type'

export interface IconProps {
  size: number
  fill: AvailablePickedColor
  color: AvailablePickedColor
  align: 'top' | 'middle' | 'bottom'
}

export type ReturningUseIcon<T extends Partial<IconProps> = Partial<IconProps>> = T
