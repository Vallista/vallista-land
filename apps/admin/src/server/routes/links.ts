import { Hono } from 'hono'
import { runLinkCheck } from '../lib/links'

const route = new Hono()

route.get('/check', async (c) => {
  const external = c.req.query('external') === '1'
  try {
    const result = await runLinkCheck({ external })
    return c.json(result)
  } catch (e) {
    const err = e as Error
    return c.json({ error: err.message }, 500)
  }
})

export default route
