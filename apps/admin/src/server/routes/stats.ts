import { Hono } from 'hono'
import { buildStatsReport } from '../lib/stats'

const route = new Hono()

route.get('/', async (c) => {
  try {
    const report = await buildStatsReport()
    return c.json(report)
  } catch (e) {
    const err = e as Error
    return c.json({ error: err.message }, 500)
  }
})

export default route
