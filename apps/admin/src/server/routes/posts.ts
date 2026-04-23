import { Hono } from 'hono'
import { createPost, getPost, listPosts, movePost, savePost, trashPost } from '../lib/post-repo'
import { CATEGORIES } from '../paths'
import type { Category, CreatePostBody, SavePostBody } from '../../lib/types'

type TaxonomyCount = { value: string; count: number }
type Taxonomy = { tags: TaxonomyCount[]; series: TaxonomyCount[] }

async function buildTaxonomy(): Promise<Taxonomy> {
  const tagMap = new Map<string, number>()
  const seriesMap = new Map<string, number>()
  for (const cat of CATEGORIES) {
    const posts = await listPosts(cat)
    for (const p of posts) {
      for (const t of p.tags) {
        if (!t) continue
        tagMap.set(t, (tagMap.get(t) ?? 0) + 1)
      }
      if (p.series) seriesMap.set(p.series, (seriesMap.get(p.series) ?? 0) + 1)
    }
  }
  const sort = (m: Map<string, number>): TaxonomyCount[] =>
    [...m.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
  return { tags: sort(tagMap), series: sort(seriesMap) }
}

const route = new Hono()

function isCategory(v: string | undefined): v is Category {
  return typeof v === 'string' && (CATEGORIES as readonly string[]).includes(v)
}

function isSavePostBody(v: unknown): v is SavePostBody {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return (
    typeof o.content === 'string' &&
    (o.expectedHash === null || typeof o.expectedHash === 'string') &&
    !!o.frontmatter &&
    typeof o.frontmatter === 'object'
  )
}

function isCreatePostBody(v: unknown): v is CreatePostBody {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return (
    typeof o.slug === 'string' &&
    typeof o.content === 'string' &&
    !!o.frontmatter &&
    typeof o.frontmatter === 'object' &&
    isCategory(typeof o.category === 'string' ? o.category : undefined)
  )
}

route.get('/taxonomy', async (c) => {
  try {
    return c.json(await buildTaxonomy())
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : String(e) }, 500)
  }
})

route.get('/', async (c) => {
  const category = c.req.query('category')
  if (!isCategory(category)) {
    return c.json({ error: 'invalid or missing category' }, 400)
  }
  const posts = await listPosts(category)
  return c.json(posts)
})

route.post('/', async (c) => {
  const body: unknown = await c.req.json().catch(() => null)
  if (!isCreatePostBody(body)) {
    return c.json({ error: 'invalid body' }, 400)
  }
  if (!/^[a-zA-Z0-9가-힣_\-]+$/.test(body.slug)) {
    return c.json({ error: 'invalid slug format' }, 400)
  }
  try {
    const post = await createPost({
      category: body.category,
      slug: body.slug,
      frontmatter: body.frontmatter,
      content: body.content
    })
    return c.json(post, 201)
  } catch (e) {
    const err = e as Error & { code?: string }
    if (err.code === 'EEXIST') return c.json({ error: 'slug already exists' }, 409)
    return c.json({ error: err.message }, 500)
  }
})

route.get('/:category/:slug', async (c) => {
  const category = c.req.param('category')
  const slug = decodeURIComponent(c.req.param('slug'))
  if (!isCategory(category)) {
    return c.json({ error: 'invalid category' }, 400)
  }
  try {
    const post = await getPost(category, slug)
    return c.json(post)
  } catch (e) {
    const err = e as Error & { code?: string }
    if (err.code === 'ENOENT') return c.json({ error: 'not found' }, 404)
    return c.json({ error: err.message }, 500)
  }
})

route.put('/:category/:slug', async (c) => {
  const category = c.req.param('category')
  const slug = decodeURIComponent(c.req.param('slug'))
  if (!isCategory(category)) {
    return c.json({ error: 'invalid category' }, 400)
  }
  const body: unknown = await c.req.json().catch(() => null)
  if (!isSavePostBody(body)) {
    return c.json({ error: 'invalid body' }, 400)
  }
  try {
    const post = await savePost({
      category,
      slug,
      frontmatter: body.frontmatter,
      content: body.content,
      expectedHash: body.expectedHash
    })
    return c.json(post)
  } catch (e) {
    const err = e as Error & { code?: string }
    if (err.code === 'ENOENT') return c.json({ error: 'not found' }, 404)
    if (err.code === 'ESTALE') return c.json({ error: 'stale write' }, 409)
    return c.json({ error: err.message }, 500)
  }
})

route.delete('/:category/:slug', async (c) => {
  const category = c.req.param('category')
  const slug = decodeURIComponent(c.req.param('slug'))
  if (!isCategory(category)) {
    return c.json({ error: 'invalid category' }, 400)
  }
  try {
    const result = await trashPost(category, slug)
    return c.json({ ok: true, ...result })
  } catch (e) {
    const err = e as Error & { code?: string }
    if (err.code === 'ENOENT') return c.json({ error: 'not found' }, 404)
    return c.json({ error: err.message }, 500)
  }
})

route.post('/:category/:slug/move', async (c) => {
  const fromCategory = c.req.param('category')
  const slug = decodeURIComponent(c.req.param('slug'))
  if (!isCategory(fromCategory)) {
    return c.json({ error: 'invalid category' }, 400)
  }
  const body: unknown = await c.req.json().catch(() => null)
  const targetRaw =
    body && typeof body === 'object' && 'toCategory' in (body as Record<string, unknown>)
      ? String((body as Record<string, unknown>).toCategory)
      : undefined
  if (!isCategory(targetRaw)) {
    return c.json({ error: 'invalid target category' }, 400)
  }
  try {
    const meta = await movePost({ fromCategory, toCategory: targetRaw, slug })
    return c.json(meta)
  } catch (e) {
    const err = e as Error & { code?: string }
    if (err.code === 'ENOENT') return c.json({ error: 'not found' }, 404)
    if (err.code === 'EEXIST') return c.json({ error: 'slug exists in target' }, 409)
    if (err.code === 'EINVAL') return c.json({ error: err.message }, 400)
    return c.json({ error: err.message }, 500)
  }
})

export default route
