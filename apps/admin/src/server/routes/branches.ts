import { Hono } from 'hono'

const route = new Hono()

route.get('/', async (c) => {
  return c.json({ error: 'not implemented' }, 501)
})

route.post('/', async (c) => {
  return c.json({ error: 'not implemented' }, 501)
})

route.post('/checkout', async (c) => {
  return c.json({ error: 'not implemented' }, 501)
})

route.delete('/:name', async (c) => {
  return c.json({ error: 'not implemented' }, 501)
})

route.post('/stash', async (c) => {
  return c.json({ error: 'not implemented' }, 501)
})

route.post('/stash/:index/pop', async (c) => {
  return c.json({ error: 'not implemented' }, 501)
})

route.delete('/stash/:index', async (c) => {
  return c.json({ error: 'not implemented' }, 501)
})

export default route
