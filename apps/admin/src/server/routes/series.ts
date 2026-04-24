import { Hono } from 'hono'
import { buildSeriesReport } from '../lib/series'

const route = new Hono()

route.get('/', async (c) => {
  try {
    const report = await buildSeriesReport()
    return c.json(report)
  } catch (e) {
    const err = e as Error
    return c.json({ error: err.message }, 500)
  }
})

export default route
