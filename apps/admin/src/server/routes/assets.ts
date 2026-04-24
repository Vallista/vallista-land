import { Hono } from 'hono'
import { buildAssetReport, deleteAsset } from '../lib/assets'

const route = new Hono()

route.get('/report', async (c) => {
  try {
    const report = await buildAssetReport()
    return c.json(report)
  } catch (e) {
    const err = e as Error
    return c.json({ error: err.message }, 500)
  }
})

route.delete('/', async (c) => {
  const body: unknown = await c.req.json().catch(() => null)
  if (!body || typeof body !== 'object') return c.json({ error: 'invalid body' }, 400)
  const paths = (body as { paths?: unknown }).paths
  if (!Array.isArray(paths) || !paths.every((p) => typeof p === 'string')) {
    return c.json({ error: 'paths must be string[]' }, 400)
  }
  let deleted = 0
  const errors: Array<{ path: string; error: string }> = []
  for (const p of paths as string[]) {
    try {
      await deleteAsset(p)
      deleted++
    } catch (e) {
      errors.push({ path: p, error: e instanceof Error ? e.message : String(e) })
    }
  }
  return c.json({ deleted, errors })
})

export default route
