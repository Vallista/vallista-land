import { Hono } from 'hono'
import { deletePreset, listPresets, savePreset } from '../lib/presets'
import { CATEGORIES } from '../../lib/types'

const route = new Hono()

route.get('/', async (c) => {
  const items = await listPresets()
  return c.json({ items })
})

route.post('/', async (c) => {
  const body: unknown = await c.req.json().catch(() => null)
  if (!body || typeof body !== 'object') return c.json({ error: 'invalid body' }, 400)
  const b = body as {
    id?: unknown
    name?: unknown
    category?: unknown
    frontmatter?: unknown
    body?: unknown
  }
  if (typeof b.name !== 'string' || !b.name.trim()) {
    return c.json({ error: 'name required' }, 400)
  }
  if (typeof b.category !== 'string' || !(CATEGORIES as readonly string[]).includes(b.category)) {
    return c.json({ error: 'invalid category' }, 400)
  }
  if (!b.frontmatter || typeof b.frontmatter !== 'object') {
    return c.json({ error: 'frontmatter required' }, 400)
  }
  if (typeof b.body !== 'string') {
    return c.json({ error: 'body required' }, 400)
  }
  try {
    const preset = await savePreset({
      id: typeof b.id === 'string' ? b.id : undefined,
      name: b.name.trim(),
      category: b.category as (typeof CATEGORIES)[number],
      frontmatter: b.frontmatter as Record<string, unknown>,
      body: b.body
    })
    return c.json(preset)
  } catch (e) {
    const err = e as Error & { code?: string }
    return c.json({ error: err.message }, err.code === 'EINVAL' ? 400 : 500)
  }
})

route.delete('/:id', async (c) => {
  const id = c.req.param('id')
  try {
    await deletePreset(id)
    return c.body(null, 204)
  } catch (e) {
    const err = e as Error & { code?: string }
    if (err.code === 'ENOENT') return c.json({ error: 'not found' }, 404)
    return c.json({ error: err.message }, err.code === 'EINVAL' ? 400 : 500)
  }
})

export default route
