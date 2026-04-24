import { Hono } from 'hono'
import { readFile, readdir, stat } from 'node:fs/promises'
import { extname, resolve } from 'node:path'
import { CATEGORIES, CONTENTS_ROOT, categoryDir } from './paths'
import postsRoute from './routes/posts'
import publishRoute from './routes/publish'
import analyticsRoute from './routes/analytics'
import mediaRoute from './routes/media'
import draftsRoute from './routes/drafts'
import ciRoute from './routes/ci'
import assetsRoute from './routes/assets'
import statsRoute from './routes/stats'
import linksRoute from './routes/links'
import seriesRoute from './routes/series'
import presetsRoute from './routes/presets'
import backlinksRoute from './routes/backlinks'
import branchesRoute from './routes/branches'
import { sweepOldDrafts } from './lib/draft-repo'

export function createApp(): Hono {
  const app = new Hono()

  app.get('/api/ping', async (c) => {
    const counts: Record<string, number> = {}
    for (const cat of CATEGORIES) {
      try {
        const entries = await readdir(categoryDir(cat), { withFileTypes: true })
        counts[cat] = entries.filter((e) => !e.name.startsWith('.')).length
      } catch {
        counts[cat] = 0
      }
    }
    return c.json({ ok: true, contentsRoot: CONTENTS_ROOT, counts })
  })

  app.route('/api/posts', postsRoute)
  app.route('/api/publish', publishRoute)
  app.route('/api/analytics', analyticsRoute)
  app.route('/api/media', mediaRoute)
  app.route('/api/drafts', draftsRoute)
  app.route('/api/ci', ciRoute)
  app.route('/api/assets', assetsRoute)
  app.route('/api/stats', statsRoute)
  app.route('/api/links', linksRoute)
  app.route('/api/series', seriesRoute)
  app.route('/api/presets', presetsRoute)
  app.route('/api/backlinks', backlinksRoute)
  app.route('/api/branches', branchesRoute)

  return app
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8'
}

function mountStatic(app: Hono, root: string): void {
  const absRoot = resolve(root)
  app.get('/*', async (c) => {
    const url = new URL(c.req.url)
    const rel = decodeURIComponent(url.pathname).replace(/^\/+/, '')
    const candidate = rel === '' ? 'index.html' : rel
    const full = resolve(absRoot, candidate)
    if (!full.startsWith(absRoot)) return c.notFound()
    try {
      const s = await stat(full)
      if (s.isFile()) {
        const buf = await readFile(full)
        const mime = MIME[extname(full).toLowerCase()] ?? 'application/octet-stream'
        return c.body(buf, 200, { 'Content-Type': mime })
      }
    } catch {
      // fall through to SPA fallback
    }
    try {
      const html = await readFile(resolve(absRoot, 'index.html'))
      return c.body(html, 200, { 'Content-Type': MIME['.html'] })
    } catch {
      return c.notFound()
    }
  })
}

export interface StartServerOptions {
  port?: number
  hostname?: string
  staticRoot?: string
}

export interface ServerHandle {
  port: number
  close(): Promise<void>
}

export async function startServer(opts: StartServerOptions = {}): Promise<ServerHandle> {
  const { serve } = await import('@hono/node-server')
  const app = createApp()
  if (opts.staticRoot) mountStatic(app, opts.staticRoot)
  return new Promise<ServerHandle>((res) => {
    const srv = serve(
      {
        fetch: app.fetch,
        port: opts.port ?? 0,
        hostname: opts.hostname ?? '127.0.0.1'
      },
      (info) => {
        res({
          port: info.port,
          close: () =>
            new Promise<void>((r) => {
              srv.close(() => r())
            })
        })
      }
    )
  })
}

const defaultApp = createApp()
void sweepOldDrafts()
export default defaultApp
