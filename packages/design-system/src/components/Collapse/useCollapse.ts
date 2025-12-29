import { useEffect, useState } from 'react'

import { CollapseProps, ReturningUseCollapse } from './type'

export function useCollapse<T extends Pick<Partial<CollapseProps>, 'defaultExpanded' | 'size' | 'card' | 'title'>>(
  props: T
): T & ReturningUseCollapse {
  const { defaultExpanded = true, size = 'medium', card = false, title } = props
  const [expanded, setExpanded] = useState(defaultExpanded)

  // Context 없이 독립적으로 동작
  useEffect(() => {
    // 초기 마운트 시 defaultExpanded가 true이면 펼쳐진 상태로 설정
    if (defaultExpanded) {
      setExpanded(true)
    }
  }, [defaultExpanded])

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
