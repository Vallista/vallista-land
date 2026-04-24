import { Hono } from 'hono'
import { readFile, stat } from 'node:fs/promises'
import {
  createDraft,
  deleteDraft,
  finalizeDraft,
  getDraftDoc,
  isValidDraftId,
  listDrafts,
  resolveDraftAssetPath,
  saveDraftAsset,
  saveDraftDoc
} from '../lib/draft-repo'
import { CATEGORIES } from '../paths'
import type { Category } from '../../lib/types'

const MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  mp4: 'video/mp4',
  webm: 'video/webm',
  pdf: 'application/pdf'
}

function guessMime(path: string): string {
  const dot = path.lastIndexOf('.')
  if (dot < 0) return 'application/octet-stream'
  const ext = path.slice(dot + 1).toLowerCase()
  return MIME[ext] ?? 'application/octet-stream'
}

function isCategory(v: unknown): v is Category {
  return typeof v === 'string' && (CATEGORIES as readonly string[]).includes(v)
}

const route = new Hono()

route.get('/', async (c) => {
  const items = await listDrafts()
  return c.json({ items })
})

route.post('/', async (c) => {
  const r = await createDraft()
  return c.json(r, 201)
})

route.get('/:id', async (c) => {
  const id = c.req.param('id')
  if (!isValidDraftId(id)) return c.json({ error: 'invalid draft id' }, 400)
  const doc = await getDraftDoc(id)
  if (!doc) return c.json({ error: 'not found' }, 404)
  return c.json({ draftId: id, ...doc })
})

route.put('/:id', async (c) => {
  const id = c.req.param('id')
  if (!isValidDraftId(id)) return c.json({ error: 'invalid draft id' }, 400)
  const body: unknown = await c.req.json().catch(() => null)
  if (!body || typeof body !== 'object') return c.json({ error: 'invalid body' }, 400)
  const o = body as Record<string, unknown>
  const category = isCategory(o.category) ? o.category : null
  const slug = typeof o.slug === 'string' ? o.slug : ''
  const title = typeof o.title === 'string' ? o.title : ''
  const frontmatter =
    o.frontmatter && typeof o.frontmatter === 'object'
      ? (o.frontmatter as Record<string, unknown>)
      : {}
  const content = typeof o.content === 'string' ? o.content : ''
  try {
    const doc = await saveDraftDoc(id, { category, slug, title, frontmatter, content })
    return c.json({ draftId: id, ...doc })
  } catch (e) {
    const err = e as NodeJS.ErrnoException
    return c.json({ error: err.message }, err.code === 'EINVAL' ? 400 : 500)
  }
})

route.delete('/:id', async (c) => {
  const id = c.req.param('id')
  if (!isValidDraftId(id)) return c.json({ error: 'invalid draft id' }, 400)
  await deleteDraft(id)
  return c.json({ ok: true })
})

route.post('/:id/assets', async (c) => {
  const id = c.req.param('id')
  if (!isValidDraftId(id)) return c.json({ error: 'invalid draft id' }, 400)
  let form: FormData
  try {
    form = await c.req.formData()
  } catch {
    return c.json({ error: 'invalid multipart body' }, 400)
  }
  const file = form.get('file')
  if (!(file instanceof File)) return c.json({ error: 'missing file' }, 400)
  if (file.size === 0) return c.json({ error: 'empty file' }, 400)
  const bytes = new Uint8Array(await file.arrayBuffer())
  try {
    const r = await saveDraftAsset(id, file.name || 'upload', bytes)
    return c.json(r)
  } catch (e) {
    const err = e as NodeJS.ErrnoException
    return c.json({ error: err.message }, err.code === 'EINVAL' ? 400 : 500)
  }
})

route.get('/:id/media/*', async (c) => {
  const id = c.req.param('id')
  if (!isValidDraftId(id)) return c.json({ error: 'invalid draft id' }, 400)
  const url = new URL(c.req.url)
  const prefix = `/api/drafts/${id}/media/`
  if (!url.pathname.startsWith(prefix)) return c.json({ error: 'bad url' }, 400)
  const rest = url.pathname.slice(prefix.length)
  const subSegs = rest.split('/').filter(Boolean).map((s) => decodeURIComponent(s))
  if (subSegs.length === 0) return c.json({ error: 'bad url' }, 400)
  try {
    const absPath = await resolveDraftAssetPath(id, subSegs)
    const st = await stat(absPath)
    if (!st.isFile()) return c.json({ error: 'not a file' }, 404)
    const data = await readFile(absPath)
    return new Response(data, {
      headers: {
        'content-type': guessMime(absPath),
        'cache-control': 'no-cache'
      }
    })
  } catch (e) {
    const err = e as NodeJS.ErrnoException
    if (err.code === 'EINVAL') return c.json({ error: err.message }, 400)
    return c.json({ error: 'not found' }, 404)
  }
})

route.post('/:id/finalize', async (c) => {
  const id = c.req.param('id')
  if (!isValidDraftId(id)) return c.json({ error: 'invalid draft id' }, 400)
  const body: unknown = await c.req.json().catch(() => null)
  if (!body || typeof body !== 'object') return c.json({ error: 'invalid body' }, 400)
  const o = body as Record<string, unknown>
  const category = o.category
  const slug = o.slug
  const frontmatter = o.frontmatter
  const content = o.content
  if (!isCategory(category)) return c.json({ error: 'invalid category' }, 400)
  if (typeof slug !== 'string' || !/^[a-zA-Z0-9가-힣_\-]+$/.test(slug)) {
    return c.json({ error: 'invalid slug' }, 400)
  }
  if (!frontmatter || typeof frontmatter !== 'object') {
    return c.json({ error: 'invalid frontmatter' }, 400)
  }
  if (typeof content !== 'string') return c.json({ error: 'invalid content' }, 400)

  try {
    const r = await finalizeDraft({
      draftId: id,
      category,
      slug,
      frontmatter: frontmatter as Record<string, unknown>,
      content
    })
    return c.json({ category, slug, filePath: r.filePath }, 201)
  } catch (e) {
    const err = e as NodeJS.ErrnoException
    if (err.code === 'EEXIST') return c.json({ error: err.message }, 409)
    if (err.code === 'ENOENT') return c.json({ error: err.message }, 404)
    if (err.code === 'EINVAL') return c.json({ error: err.message }, 400)
    return c.json({ error: err.message }, 500)
  }
})

export default route
