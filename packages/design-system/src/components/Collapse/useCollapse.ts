import { useEffect, useState } from 'react'

import { useCollapseContext } from '.'
import { CollapseProps, ReturningUseCollapse } from './type'

export function useCollapse<T extends Pick<Partial<CollapseProps>, 'defaultExpanded' | 'size' | 'card' | 'title'>>(
  props: T
): T & ReturningUseCollapse {
  const { defaultExpanded = true, size = 'medium', card = false, title } = props
  const [expanded, setExpanded] = useState(defaultExpanded)

  const { state } = useCollapseContext()

  useEffect(() => {
    if (expanded) {
      state.setExpandedTarget(title || '')
    }
  }, [expanded, state, title])

  useEffect(() => {
    if (state.expandedTarget !== title) {
      setExpanded(false)
    }
  }, [state.expandedTarget, title])

  return {
    ...props,
    title,
    defaultExpanded,
    size,
    card,
    expanded,
    fold
  }

  function fold(): void {
    setExpanded((flag) => !flag)
  }
}
