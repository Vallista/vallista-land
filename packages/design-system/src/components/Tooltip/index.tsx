import { useRef, useState } from 'react'

import { TooltipProps } from './type'
import { useTooltip } from './useTooltip'
import { tooltip } from './Tooltip.css'

export const Tooltip = (props: TooltipProps) => {
  const { text, position, type, children } = useTooltip(props)
  const childrenRef = useRef<HTMLDivElement>(null)
  const [isHover, setHover] = useState(false)

  const tooltipClass = tooltip({
    type,
    position,
    visible: isHover
  })

  const handleMouseEnter = () => {
    setHover(true)
  }

  const handleMouseLeave = () => {
    setHover(false)
  }

  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div style={{ position: 'relative' }} ref={childrenRef}>
        {children}
      </div>
      {isHover && (
        <div className={tooltipClass} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          {text}
        </div>
      )}
    </div>
  )
}

export type { TooltipProps } from './type'
