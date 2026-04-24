import { Hono } from 'hono'
import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import {
  checkoutBranch,
  createBranch,
  deleteBranch,
  listBranches,
  stashDrop,
  stashPop,
  stashPush
} from '../lib/branches'

const route = new Hono()

function errResponse(c: Context, e: unknown) {
  const err = e as Error & { code?: string }
  const status: ContentfulStatusCode =
    err.code === 'EINVAL'
      ? 400
      : err.code === 'EDIRTY'
        ? 409
        : err.code === 'EPROTECTED'
          ? 403
          : 500
  return c.json({ ok: false, error: err.message }, status)
}

route.get('/', async (c) => {
  try {
    const result = await listBranches()
    return c.json(result)
  } catch (e) {
    return errResponse(c, e)
  }
})

route.post('/', async (c) => {
  const body = await c.req.json().catch(() => null)
  const name = body && typeof body === 'object' ? (body as { name?: unknown }).name : null
  if (typeof name !== 'string') return c.json({ ok: false, error: 'name required' }, 400)
  try {
    return c.json(await createBranch(name))
  } catch (e) {
    return errResponse(c, e)
  }
})

route.post('/checkout', async (c) => {
  const body = await c.req.json().catch(() => null)
  const name = body && typeof body === 'object' ? (body as { name?: unknown }).name : null
  if (typeof name !== 'string') return c.json({ ok: false, error: 'name required' }, 400)
  try {
    return c.json(await checkoutBranch(name))
  } catch (e) {
    return errResponse(c, e)
  }
})

route.delete('/:name', async (c) => {
  const name = c.req.param('name')
  const force = c.req.query('force') === '1'
  try {
    return c.json(await deleteBranch(name, force))
  } catch (e) {
    return errResponse(c, e)
  }
})

route.post('/stash', async (c) => {
  const body = await c.req.json().catch(() => null)
  const message =
    body && typeof body === 'object' && typeof (body as { message?: unknown }).message === 'string'
      ? (body as { message: string }).message
      : ''
  try {
    return c.json(await stashPush(message))
  } catch (e) {
    return errResponse(c, e)
  }
})

route.post('/stash/:index/pop', async (c) => {
  const index = Number(c.req.param('index'))
  try {
    return c.json(await stashPop(index))
  } catch (e) {
    return errResponse(c, e)
  }
})

route.delete('/stash/:index', async (c) => {
  const index = Number(c.req.param('index'))
  try {
    return c.json(await stashDrop(index))
  } catch (e) {
    return errResponse(c, e)
  }
})

export default route
