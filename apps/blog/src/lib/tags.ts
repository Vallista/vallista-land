import type { CollectionEntry } from 'astro:content'

export interface TagStat {
  tag: string
  count: number
}

export function countTags(entries: CollectionEntry<'articles'>[]): TagStat[] {
  const counts = new Map<string, number>()
  for (const entry of entries) {
    for (const tag of entry.data.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
}

export function relatedTags(
  entries: CollectionEntry<'articles'>[],
  target: string,
  minCooccurrences = 2
): string[] {
  const cooccurCount = new Map<string, number>()
  for (const entry of entries) {
    if (!entry.data.tags.includes(target)) continue
    for (const t of entry.data.tags) {
      if (t === target) continue
      cooccurCount.set(t, (cooccurCount.get(t) ?? 0) + 1)
    }
  }
  return [...cooccurCount.entries()]
    .filter(([, n]) => n >= minCooccurrences)
    .sort((a, b) => b[1] - a[1])
    .map(([t]) => t)
}

export function slugifyTag(tag: string): string {
  return encodeURIComponent(tag.toLowerCase().replace(/\s+/g, '-'))
}
