import { stat } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { listAllPostSources } from './post-repo'
import type { Category } from '../../lib/types'

export type LinkCheckItem = {
  category: Category
  slug: string
  type: 'image' | 'link'
  raw: string
  reason: 'missing-asset' | 'http-error' | 'network-error'
  status?: number
  message?: string
}

export type LinkCheckResult = {
  scannedPosts: number
  checkedLinks: number
  items: LinkCheckItem[]
}

type RawRef = { type: 'image' | 'link'; raw: string; target: string }

function normalizeTarget(raw: string): string {
  let t = raw.trim()
  if (t.startsWith('<') && t.endsWith('>')) t = t.slice(1, -1)
  else if (t.startsWith('<')) t = t.slice(1)
  return t
}

function extractRefs(src: string): RawRef[] {
  const out: RawRef[] = []
  const rxImg = /!\[[^\]]*\]\(\s*(<[^>]+>|[^)\s]+)(?:\s+"[^"]*")?\s*\)/g
  const rxLink = /(?<!!)\[[^\]]*\]\(\s*(<[^>]+>|[^)\s]+)(?:\s+"[^"]*")?\s*\)/g
  for (const m of src.matchAll(rxImg)) {
    out.push({ type: 'image', raw: m[0], target: normalizeTarget(m[1]) })
  }
  for (const m of src.matchAll(rxLink)) {
    out.push({ type: 'link', raw: m[0], target: normalizeTarget(m[1]) })
  }
  return out
}

function isExternal(url: string): boolean {
  return /^https?:\/\//i.test(url)
}

function isInternalAnchorOrRoute(url: string): boolean {
  if (url.startsWith('#')) return true
  if (url.startsWith('/')) return true
  if (url.startsWith('mailto:')) return true
  return false
}

async function checkLocalAsset(postAbs: string, target: string): Promise<boolean> {
  const clean = target.split('#')[0].split('?')[0]
  const abs = resolve(dirname(postAbs), clean)
  try {
    const st = await stat(abs)
    return st.isFile()
  } catch {
    return false
  }
}

async function checkExternal(
  url: string,
  signal: AbortSignal
): Promise<{ ok: true } | { ok: false; status?: number; message?: string; networkErr?: boolean }> {
  try {
    let res = await fetch(url, { method: 'HEAD', signal, redirect: 'follow' })
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, { method: 'GET', signal, redirect: 'follow' })
    }
    if (res.ok) return { ok: true }
    return { ok: false, status: res.status, message: res.statusText }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e), networkErr: true }
  }
}

async function runLimited<T, R>(
  items: T[],
  limit: number,
  fn: (t: T) => Promise<R>
): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let i = 0
  async function worker() {
    while (true) {
      const idx = i++
      if (idx >= items.length) return
      out[idx] = await fn(items[idx])
    }
  }
  const n = Math.min(limit, items.length)
  await Promise.all(Array.from({ length: n }, () => worker()))
  return out
}

export async function runLinkCheck(opts?: { external?: boolean }): Promise<LinkCheckResult> {
  const sources = await listAllPostSources()
  const items: LinkCheckItem[] = []
  let checkedLinks = 0

  type ExternalJob = {
    src: (typeof sources)[number]
    ref: RawRef
  }
  const externalJobs: ExternalJob[] = []

  for (const src of sources) {
    const refs = extractRefs(src.content)
    for (const ref of refs) {
      if (isInternalAnchorOrRoute(ref.target)) continue
      if (isExternal(ref.target)) {
        if (opts?.external) {
          externalJobs.push({ src, ref })
        }
        continue
      }
      checkedLinks += 1
      const ok = await checkLocalAsset(src.absPath, ref.target)
      if (!ok) {
        items.push({
          category: src.category,
          slug: src.slug,
          type: ref.type,
          raw: ref.raw,
          reason: 'missing-asset'
        })
      }
    }
  }

  if (opts?.external && externalJobs.length > 0) {
    const ctrl = new AbortController()
    const to = setTimeout(() => ctrl.abort(), 20_000)
    try {
      const results = await runLimited(externalJobs, 6, async ({ src, ref }) => {
        const timeout = AbortSignal.timeout(5_000)
        const signal = AbortSignal.any
          ? AbortSignal.any([ctrl.signal, timeout])
          : ctrl.signal
        const r = await checkExternal(ref.target, signal)
        return { src, ref, r }
      })
      for (const { src, ref, r } of results) {
        checkedLinks += 1
        if (r.ok) continue
        items.push({
          category: src.category,
          slug: src.slug,
          type: ref.type,
          raw: ref.raw,
          reason: r.networkErr ? 'network-error' : 'http-error',
          status: 'status' in r ? r.status : undefined,
          message: r.message
        })
      }
    } finally {
      clearTimeout(to)
    }
  }

  return { scannedPosts: sources.length, checkedLinks, items }
}
