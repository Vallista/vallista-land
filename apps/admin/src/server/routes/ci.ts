import { Hono } from 'hono'
import { fetchLatestRun, fetchRunHistory } from '../lib/ci'

const route = new Hono()

route.get('/latest', async (c) => {
  try {
    const result = await fetchLatestRun()
    return c.json(result)
  } catch (e) {
    const err = e as Error
    return c.json({ error: err.message }, 500)
  }
})

route.get('/runs', async (c) => {
  const limit = Number(c.req.query('limit')) || 10
  try {
    const result = await fetchRunHistory(limit)
    return c.json(result)
  } catch (e) {
    const err = e as Error
    return c.json({ error: err.message }, 500)
  }
})

export default route
