import { useEffect, useRef } from 'react'

export const useMount = (fn: () => void): void => {
  const fnRef = useRef(fn)
  // always keep latest
  fnRef.current = fn

  useEffect(() => {
    fnRef.current()
    // empty deps: run once on mount
  }, [])
}
