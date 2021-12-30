import { useEffect, useState } from 'react'

import { useCollapseContext } from '.'
import { CollapseProps, ReturningUseCollapse } from './type'

export function useCollapse<T extends Pick<Partial<CollapseProps>, 'defaultExpanded' | 'size' | 'card' | 'title'>>(
  props: T
): T & ReturningUseCollapse {
  const { defaultExpanded = true, size = 'medium', card = false, title } = props
  const [expanded, setExpanded] = useState(defaultExpanded)

  try {
    const { state } = useCollapseContext()

    useEffect(() => {
      if (expanded) {
        state.setExpandedTarget(title || '')
      }
    }, [expanded])

    useEffect(() => {
      if (state.expandedTarget !== title) {
        setExpanded(false)
      }
    }, [state.expandedTarget])
  } catch (err) {
    // 에러 아님
  }

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
