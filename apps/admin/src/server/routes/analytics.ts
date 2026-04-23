import { Hono } from 'hono'
import { fetchOverview } from '../lib/analytics'

const route = new Hono()

route.get('/overview', async (c) => {
  const daysRaw = c.req.query('days')
  const days = Math.min(90, Math.max(1, Number(daysRaw) || 30))
  try {
    const result = await fetchOverview(days)
    return c.json(result)
  } catch (e) {
    const err = e as Error
    return c.json({ error: err.message }, 500)
  }
})

export default route
