import { useState } from 'react'

import { ReturningUseModal } from './type'

export function useModal(): ReturningUseModal {
  const [active, setActive] = useState<boolean>(false)

  return {
    active,
    open,
    close
  }

  function open(): void {
    setActive(true)
  }

  function close(): void {
    setActive(false)
  }
}
