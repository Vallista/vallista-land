import type { CollectionEntry } from 'astro:content'

export interface SeriesEntry {
  name: string
  slug: string
  count: number
}

export interface SeriesPost {
  id: string
  title: string
  date: Date
  order: number
}

// series 필드는 "문자열"(시리즈 이름) 또는 { name, slug, order, total } 객체 둘 다 허용.
function seriesName(entry: CollectionEntry<'articles'>): string | null {
  const s = entry.data.series
  if (!s) return null
  if (typeof s === 'string') return s
  return s.name ?? s.slug ?? null
}

function seriesOrder(entry: CollectionEntry<'articles'>): number {
  const s = entry.data.series
  if (typeof s === 'object' && typeof s?.order === 'number') return s.order
  // 명시적 order 없으면 오름차순 날짜 기준
  return entry.data.date.getTime()
}

// Astro getStaticPaths 는 raw 문자열을 받아야 폴더/URL 인코딩을 올바르게 처리.
// 이전: encodeURIComponent 로 이중 인코딩 → 404 발생.
export function seriesNameToSlug(name: string): string {
  return name.replace(/\s+/g, '-')
}

export function collectSeries(entries: CollectionEntry<'articles'>[]): SeriesEntry[] {
  const map = new Map<string, number>()
  for (const entry of entries) {
    const name = seriesName(entry)
    if (!name) continue
    map.set(name, (map.get(name) ?? 0) + 1)
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, slug: seriesNameToSlug(name), count }))
    .filter((s) => s.count >= 2) // 2편 이상인 시리즈만 사이드바에 노출
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

export function postsInSeries(
  entries: CollectionEntry<'articles'>[],
  name: string
): SeriesPost[] {
  return entries
    .filter((e) => seriesName(e) === name)
    .map((e) => ({
      id: e.id,
      title: e.data.title,
      date: e.data.date,
      order: seriesOrder(e)
    }))
    .sort((a, b) => a.order - b.order)
}

export function seriesForEntry(
  entries: CollectionEntry<'articles'>[],
  current: CollectionEntry<'articles'>
): { name: string; slug: string; posts: SeriesPost[] } | null {
  const name = seriesName(current)
  if (!name) return null
  const posts = postsInSeries(entries, name)
  if (posts.length < 2) return null
  return { name, slug: seriesNameToSlug(name), posts }
}
