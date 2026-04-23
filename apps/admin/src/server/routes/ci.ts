import { Hono } from 'hono'
import { fetchLatestRun } from '../lib/ci'

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

export default route
