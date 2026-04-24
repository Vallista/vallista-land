import { Hono } from 'hono'
import { buildBacklinkReport } from '../lib/backlinks'

const route = new Hono()

route.get('/', async (c) => {
  try {
    const report = await buildBacklinkReport()
    return c.json(report)
  } catch (e) {
    const err = e as Error
    return c.json({ error: err.message }, 500)
  }
})

export default route
