import { listAllPostSources, type PostSource } from './post-repo'
import type { Category } from '../../lib/types'

export type BacklinkEdge = {
  from: { category: Category; slug: string; title: string }
  to: { category: Category; slug: string; title: string }
  target: string
}

export type BacklinkReport = {
  edges: BacklinkEdge[]
  byPost: Array<{
    category: Category
    slug: string
    title: string
    incoming: number
    outgoing: number
  }>
}

function pickTitle(src: PostSource): string {
  const t = src.data.title
  return typeof t === 'string' && t.length > 0 ? t : src.slug
}

function extractLinks(src: string): string[] {
  const out = new Set<string>()
  const rxLink = /(?<!!)\[[^\]]*\]\(\s*(<[^>]+>|[^)\s]+)(?:\s+"[^"]*")?\s*\)/g
  for (const m of src.matchAll(rxLink)) {
    let t = m[1].trim()
    if (t.startsWith('<') && t.endsWith('>')) t = t.slice(1, -1)
    else if (t.startsWith('<')) t = t.slice(1)
    out.add(t)
  }
  return [...out]
}

function isInternalPostPath(target: string): boolean {
  return /^\/(articles|notes|projects)\//.test(target)
}

function parseInternal(target: string): { category: Category; slug: string } | null {
  const clean = target.split('#')[0].split('?')[0]
  const m = clean.match(/^\/(articles|notes|projects)\/([^/]+)\/?$/)
  if (!m) return null
  return { category: m[1] as Category, slug: m[2] }
}

export async function buildBacklinkReport(): Promise<BacklinkReport> {
  const sources = await listAllPostSources()

  const postIndex = new Map<string, PostSource>()
  for (const s of sources) postIndex.set(`${s.category}/${s.slug}`, s)

  const edges: BacklinkEdge[] = []
  const inc = new Map<string, number>()
  const out = new Map<string, number>()

  for (const src of sources) {
    if (src.data.draft === true) continue
    if (typeof src.data.status === 'string' && src.data.status === 'trashed') continue

    for (const target of extractLinks(src.content)) {
      if (!isInternalPostPath(target)) continue
      const parsed = parseInternal(target)
      if (!parsed) continue
      const key = `${parsed.category}/${parsed.slug}`
      const to = postIndex.get(key)
      if (!to) continue

      edges.push({
        from: {
          category: src.category,
          slug: src.slug,
          title: pickTitle(src)
        },
        to: {
          category: to.category,
          slug: to.slug,
          title: pickTitle(to)
        },
        target
      })
      inc.set(key, (inc.get(key) ?? 0) + 1)
      const fromKey = `${src.category}/${src.slug}`
      out.set(fromKey, (out.get(fromKey) ?? 0) + 1)
    }
  }

  const byPost = sources
    .filter((s) => s.data.draft !== true && s.data.status !== 'trashed')
    .map((s) => {
      const key = `${s.category}/${s.slug}`
      return {
        category: s.category,
        slug: s.slug,
        title: pickTitle(s),
        incoming: inc.get(key) ?? 0,
        outgoing: out.get(key) ?? 0
      }
    })
    .filter((x) => x.incoming > 0 || x.outgoing > 0)
    .sort((a, b) => b.incoming - a.incoming || b.outgoing - a.outgoing)

  return { edges, byPost }
}
