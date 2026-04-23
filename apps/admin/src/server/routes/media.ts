import { Hono } from 'hono'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'
import { CATEGORIES, CONTENTS_ROOT, categoryDir } from '../paths'
import type { Category } from '../paths'

const MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  mp4: 'video/mp4',
  webm: 'video/webm',
  pdf: 'application/pdf'
}

function guessMime(path: string): string {
  const dot = path.lastIndexOf('.')
  if (dot < 0) return 'application/octet-stream'
  const ext = path.slice(dot + 1).toLowerCase()
  return MIME[ext] ?? 'application/octet-stream'
}

function isCategory(v: string): v is Category {
  return (CATEGORIES as readonly string[]).includes(v)
}

const route = new Hono()

const SAFE_NAME_RE = /[^a-zA-Z0-9가-힣._\- ]+/g

function sanitizeFilename(raw: string): string {
  const base = raw.replace(/\\/g, '/').split('/').pop() ?? 'file'
  const cleaned = base.replace(SAFE_NAME_RE, '_').trim()
  return cleaned.length > 0 ? cleaned : `file${Date.now()}`
}

async function uniqueName(dir: string, filename: string): Promise<string> {
  const ext = extname(filename)
  const stem = filename.slice(0, filename.length - ext.length)
  let attempt = filename
  let i = 1
  while (true) {
    try {
      await stat(resolve(dir, attempt))
      attempt = `${stem} (${i})${ext}`
      i++
    } catch {
      return attempt
    }
  }
}

route.post('/:category/:slug', async (c) => {
  const category = c.req.param('category')
  const slug = decodeURIComponent(c.req.param('slug'))
  if (!isCategory(category)) return c.json({ error: 'invalid category' }, 400)
  if (slug.includes('/') || slug === '..' || slug === '.') {
    return c.json({ error: 'invalid slug' }, 400)
  }
  let form: FormData
  try {
    form = await c.req.formData()
  } catch {
    return c.json({ error: 'invalid multipart body' }, 400)
  }
  const file = form.get('file')
  if (!(file instanceof File)) return c.json({ error: 'missing file' }, 400)
  if (file.size === 0) return c.json({ error: 'empty file' }, 400)

  const assetsDir = resolve(categoryDir(category), slug, 'assets')
  await mkdir(assetsDir, { recursive: true })

  const safe = sanitizeFilename(file.name || 'upload')
  const finalName = await uniqueName(assetsDir, safe)
  const absPath = resolve(assetsDir, finalName)

  if (!absPath.startsWith(assetsDir + sep)) {
    return c.json({ error: 'invalid path' }, 400)
  }

  const bytes = new Uint8Array(await file.arrayBuffer())
  await writeFile(absPath, bytes)

  return c.json({
    filename: finalName,
    relativePath: `./assets/${finalName}`,
    mediaUrl: `/api/media/${category}/${encodeURIComponent(slug)}/assets/${encodeURIComponent(finalName)}`
  })
})

route.get('/*', async (c) => {
  // c.req.url 의 path 부분만 수동 파싱 → Hono 파라미터 디코딩 이슈 우회
  const url = new URL(c.req.url)
  const rest = url.pathname.replace(/^\/api\/media\//, '')
  const segments = rest.split('/').filter(Boolean).map((s) => decodeURIComponent(s))
  if (segments.length < 3) return c.json({ error: 'bad url' }, 400)

  const [category, slug, ...subSegs] = segments
  if (!isCategory(category)) return c.json({ error: 'invalid category' }, 400)
  if (subSegs.some((s) => s === '..' || s === '.')) {
    return c.json({ error: 'invalid path' }, 400)
  }

  const baseDir = resolve(categoryDir(category), slug)
  const absPath = resolve(baseDir, ...subSegs)

  if (!absPath.startsWith(baseDir + sep) && absPath !== baseDir) {
    return c.json({ error: 'invalid path' }, 400)
  }
  if (!absPath.startsWith(CONTENTS_ROOT + sep)) {
    return c.json({ error: 'invalid path' }, 400)
  }

  try {
    const st = await stat(absPath)
    if (!st.isFile()) return c.json({ error: 'not a file' }, 404)
    const data = await readFile(absPath)
    return new Response(data, {
      headers: {
        'content-type': guessMime(absPath),
        'cache-control': 'no-cache'
      }
    })
  } catch {
    return c.json({ error: 'not found' }, 404)
  }
})

export default route
