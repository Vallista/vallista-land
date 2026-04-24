import { Hono } from 'hono'

const route = new Hono()

route.get('/', async (c) => {
  return c.json({ error: 'not implemented' }, 501)
})

route.post('/', async (c) => {
  return c.json({ error: 'not implemented' }, 501)
})

route.delete('/:id', async (c) => {
  return c.json({ error: 'not implemented' }, 501)
})

export default route
