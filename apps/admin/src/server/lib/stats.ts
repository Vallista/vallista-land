import { listAllPostSources } from './post-repo'
import { CATEGORIES, type Category } from '../../lib/types'

export type StatsMonthlyPoint = { month: string; count: number }
export type StatsTagEntry = { tag: string; count: number }

export type StatsReport = {
  totalPosts: number
  totalWords: number
  avgWords: number
  byCategory: Array<{ category: Category; count: number; words: number }>
  monthly: StatsMonthlyPoint[]
  tags: StatsTagEntry[]
  longest: Array<{ category: Category; slug: string; title: string; words: number }>
  shortest: Array<{ category: Category; slug: string; title: string; words: number }>
}

function countWords(body: string): number {
  const stripped = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/[#>*_~\-]/g, ' ')
  return stripped
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}

function monthKey(date: unknown): string | null {
  if (date instanceof Date) {
    if (Number.isNaN(date.getTime())) return null
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
  }
  if (typeof date === 'string' && date.length >= 7) {
    const d = new Date(date)
    if (!Number.isNaN(d.getTime())) {
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
    }
    const m = date.match(/^(\d{4})-(\d{2})/)
    if (m) return `${m[1]}-${m[2]}`
  }
  return null
}

function pickString(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null
}

export async function buildStatsReport(): Promise<StatsReport> {
  const sources = await listAllPostSources()

  const byCategoryMap = new Map<Category, { count: number; words: number }>()
  for (const cat of CATEGORIES) byCategoryMap.set(cat, { count: 0, words: 0 })

  const monthlyMap = new Map<string, number>()
  const tagMap = new Map<string, number>()
  const perPost: Array<{ category: Category; slug: string; title: string; words: number }> = []

  let totalWords = 0

  for (const src of sources) {
    if (src.data.draft === true) continue
    if (typeof src.data.status === 'string' && src.data.status === 'trashed') continue

    const words = countWords(src.content)
    totalWords += words

    const cur = byCategoryMap.get(src.category)
    if (cur) {
      cur.count += 1
      cur.words += words
    }

    const mk = monthKey(src.data.date)
    if (mk) monthlyMap.set(mk, (monthlyMap.get(mk) ?? 0) + 1)

    if (Array.isArray(src.data.tags)) {
      for (const t of src.data.tags) {
        if (typeof t === 'string' && t.length > 0) {
          tagMap.set(t, (tagMap.get(t) ?? 0) + 1)
        }
      }
    }

    perPost.push({
      category: src.category,
      slug: src.slug,
      title: pickString(src.data.title) ?? src.slug,
      words
    })
  }

  const totalPosts = perPost.length
  const avgWords = totalPosts === 0 ? 0 : Math.round(totalWords / totalPosts)

  const byCategory = CATEGORIES.map((cat) => ({
    category: cat,
    count: byCategoryMap.get(cat)?.count ?? 0,
    words: byCategoryMap.get(cat)?.words ?? 0
  }))

  const monthly: StatsMonthlyPoint[] = [...monthlyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }))

  const tags: StatsTagEntry[] = [...tagMap.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 30)
    .map(([tag, count]) => ({ tag, count }))

  const sortedByWords = [...perPost].sort((a, b) => b.words - a.words)
  const longest = sortedByWords.slice(0, 5)
  const shortest = sortedByWords.slice(-5).reverse()

  return {
    totalPosts,
    totalWords,
    avgWords,
    byCategory,
    monthly,
    tags,
    longest,
    shortest
  }
}
