import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react'
import { useLocation } from 'react-router-dom'
import { listDrafts, listPosts } from '@/lib/api'
import { CATEGORIES, type Category, type DraftSummary, type PostMeta } from '@/lib/types'

export type SearchItem =
  | {
      kind: 'post'
      category: Category
      slug: string
      title: string
      tags: string[]
      date: string | null
      status: PostMeta['status']
    }
  | {
      kind: 'draft'
      draftId: string
      category: Category | null
      slug: string
      title: string
      updatedAt: string
    }

type SearchCtx = {
  items: SearchItem[]
  loaded: boolean
  refresh: () => Promise<void>
}

const ctx = createContext<SearchCtx | null>(null)

async function loadPosts(): Promise<SearchItem[]> {
  const lists = await Promise.all(
    CATEGORIES.map(async (cat) => {
      try {
        return await listPosts(cat)
      } catch {
        return [] as PostMeta[]
      }
    })
  )
  const out: SearchItem[] = []
  for (const list of lists) {
    for (const p of list) {
      out.push({
        kind: 'post',
        category: p.category,
        slug: p.slug,
        title: p.title,
        tags: p.tags,
        date: p.date,
        status: p.status
      })
    }
  }
  return out
}

async function loadDrafts(): Promise<SearchItem[]> {
  try {
    const drafts = await listDrafts()
    return drafts.items.map((d: DraftSummary) => ({
      kind: 'draft' as const,
      draftId: d.draftId,
      category: d.category,
      slug: d.slug,
      title: d.title,
      updatedAt: d.updatedAt
    }))
  } catch {
    return []
  }
}

export function SearchIndexProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<SearchItem[]>([])
  const [loaded, setLoaded] = useState(false)
  const location = useLocation()

  const refresh = useCallback(async () => {
    const [posts, drafts] = await Promise.all([loadPosts(), loadDrafts()])
    setItems([...drafts, ...posts])
    setLoaded(true)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh, location.pathname])

  const value = useMemo(() => ({ items, loaded, refresh }), [items, loaded, refresh])
  return <ctx.Provider value={value}>{children}</ctx.Provider>
}

export function useSearchIndex(): SearchCtx {
  const v = useContext(ctx)
  if (!v) throw new Error('SearchIndexProvider가 마운트되어 있지 않습니다.')
  return v
}

export function filterSearchItems(items: SearchItem[], query: string): SearchItem[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const tokens = q.split(/\s+/).filter(Boolean)
  const scored: Array<{ item: SearchItem; score: number }> = []
  for (const item of items) {
    const hayTitle = item.title.toLowerCase()
    const haySlug = item.slug.toLowerCase()
    const hayTags =
      item.kind === 'post' ? item.tags.join(' ').toLowerCase() : ''
    let score = 0
    let matchedAll = true
    for (const t of tokens) {
      if (!t) continue
      if (hayTitle.startsWith(t)) score += 40
      else if (hayTitle.includes(t)) score += 20
      else if (haySlug.includes(t)) score += 10
      else if (hayTags.includes(t)) score += 6
      else {
        matchedAll = false
        break
      }
    }
    if (matchedAll && score > 0) scored.push({ item, score })
  }
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, 12).map((s) => s.item)
}
