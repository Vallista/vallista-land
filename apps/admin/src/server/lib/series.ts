import { listAllPostSources } from './post-repo'
import type { Category } from '../../lib/types'

export type SeriesEntry = {
  name: string
  category: Category
  posts: Array<{
    slug: string
    title: string
    date: string | null
    order: number | null
  }>
}

export type SeriesReport = {
  items: SeriesEntry[]
}

function pickString(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null
}

function pickDate(v: unknown): string | null {
  if (v instanceof Date) return v.toISOString()
  if (typeof v === 'string' && v.length > 0) {
    const d = new Date(v)
    if (!Number.isNaN(d.getTime())) return d.toISOString()
    return v
  }
  return null
}

function extractSeries(v: unknown): { name: string; order: number | null } | null {
  if (typeof v === 'string' && v.length > 0) {
    return { name: v, order: null }
  }
  if (v && typeof v === 'object') {
    const name = pickString((v as { name?: unknown }).name)
    if (!name) return null
    const rawOrder = (v as { order?: unknown }).order
    const order = typeof rawOrder === 'number' && Number.isFinite(rawOrder) ? rawOrder : null
    return { name, order }
  }
  return null
}

export async function buildSeriesReport(): Promise<SeriesReport> {
  const sources = await listAllPostSources()
  const map = new Map<string, SeriesEntry>()

  for (const src of sources) {
    if (src.data.draft === true) continue
    if (typeof src.data.status === 'string' && src.data.status === 'trashed') continue

    const s = extractSeries(src.data.series)
    if (!s) continue

    const key = `${src.category}::${s.name}`
    let entry = map.get(key)
    if (!entry) {
      entry = { name: s.name, category: src.category, posts: [] }
      map.set(key, entry)
    }
    entry.posts.push({
      slug: src.slug,
      title: pickString(src.data.title) ?? src.slug,
      date: pickDate(src.data.date),
      order: s.order
    })
  }

  const items = [...map.values()]
  for (const it of items) {
    it.posts.sort((a, b) => {
      if (a.order !== null && b.order !== null) return a.order - b.order
      if (a.order !== null) return -1
      if (b.order !== null) return 1
      if (a.date && b.date) return a.date.localeCompare(b.date)
      if (a.date) return -1
      if (b.date) return 1
      return a.slug.localeCompare(b.slug)
    })
  }
  items.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category)
    return a.name.localeCompare(b.name)
  })

  return { items }
}
