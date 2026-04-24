import { Hono } from 'hono'
import { getGitLog, getPublishStatus, publishCommit } from '../lib/publish'

const route = new Hono()

function isCommitBody(v: unknown): v is { message: string; push?: boolean } {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return typeof o.message === 'string'
}

route.get('/status', async (c) => {
  try {
    const status = await getPublishStatus()
    return c.json(status)
  } catch (e) {
    const err = e as Error
    return c.json({ error: err.message }, 500)
  }
})

route.get('/log', async (c) => {
  const limitRaw = c.req.query('limit')
  const limit = Number(limitRaw) || 50
  try {
    const commits = await getGitLog(limit)
    return c.json({ commits })
  } catch (e) {
    const err = e as Error
    return c.json({ error: err.message }, 500)
  }
})

route.post('/commit', async (c) => {
  const body: unknown = await c.req.json().catch(() => null)
  if (!isCommitBody(body)) {
    return c.json({ error: 'invalid body' }, 400)
  }
  try {
    const result = await publishCommit({
      message: body.message,
      push: body.push !== false
    })
    return c.json(result)
  } catch (e) {
    const err = e as Error & { code?: string }
    if (err.code === 'EINVAL') return c.json({ error: err.message }, 400)
    return c.json({ error: err.message }, 500)
  }
})

export default route
