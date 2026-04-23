import { useEffect, useState } from 'react'
import { getTaxonomy } from '@/lib/api'
import type { Taxonomy } from '@/lib/types'

let cache: Taxonomy | null = null
let inflight: Promise<Taxonomy> | null = null
const subs = new Set<(t: Taxonomy) => void>()

async function load(force = false): Promise<Taxonomy> {
  if (!force && cache) return cache
  if (!force && inflight) return inflight
  inflight = getTaxonomy()
    .then((t) => {
      cache = t
      inflight = null
      for (const s of subs) s(t)
      return t
    })
    .catch((e) => {
      inflight = null
      throw e
    })
  return inflight
}

export function useTaxonomy(): { data: Taxonomy | null; reload: () => void } {
  const [data, setData] = useState<Taxonomy | null>(cache)

  useEffect(() => {
    const handler = (t: Taxonomy) => setData(t)
    subs.add(handler)
    if (!cache) void load().catch(() => {})
    else setData(cache)
    return () => {
      subs.delete(handler)
    }
  }, [])

  return { data, reload: () => void load(true).catch(() => {}) }
}
