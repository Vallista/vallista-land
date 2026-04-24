import { Hono } from 'hono'

const route = new Hono()

route.get('/check', async (c) => {
  return c.json({ error: 'not implemented' }, 501)
})

export default route
