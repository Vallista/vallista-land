import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react'
import { ping } from '@/lib/api'
import type { Category } from '@/lib/types'

type Counts = Partial<Record<Category, number>>

type CountsCtx = {
  counts: Counts
  refresh: () => Promise<void>
}

const ctx = createContext<CountsCtx | null>(null)

export function CountsProvider({ children }: { children: ReactNode }) {
  const [counts, setCounts] = useState<Counts>({})

  const refresh = useCallback(async () => {
    try {
      const d = await ping()
      setCounts(d.counts)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const value = useMemo(() => ({ counts, refresh }), [counts, refresh])
  return <ctx.Provider value={value}>{children}</ctx.Provider>
}

export function useCounts(): CountsCtx {
  const v = useContext(ctx)
  if (!v) throw new Error('CountsProvider가 마운트되어 있지 않습니다.')
  return v
}
