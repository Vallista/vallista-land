import { mkdir, readdir, rename, rm, stat, writeFile } from 'node:fs/promises'
import { extname, join, resolve, sep } from 'node:path'
import { randomBytes } from 'node:crypto'
import matter from 'gray-matter'
import { CONTENTS_ROOT, DRAFTS_ROOT, categoryDir } from '../paths'
import type { Category } from '../../lib/types'

const DRAFT_ID_RE = /^d-[0-9]+-[a-f0-9]{6,}$/
const SAFE_NAME_RE = /[^a-zA-Z0-9가-힣._\- ]+/g
const MAX_DRAFT_AGE_MS = 1000 * 60 * 60 * 24 * 7

function sanitizeFilename(raw: string): string {
  const base = (raw.replace(/\\/g, '/').split('/').pop() ?? 'file').trim()
  const cleaned = base.replace(SAFE_NAME_RE, '_').replace(/^\.+/, '')
  return cleaned.length > 0 ? cleaned : `file-${Date.now()}`
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

export function isValidDraftId(id: string): boolean {
  return DRAFT_ID_RE.test(id)
}

export function draftDir(draftId: string): string {
  const d = resolve(DRAFTS_ROOT, draftId)
  if (!d.startsWith(DRAFTS_ROOT + sep)) {
    throw Object.assign(new Error('invalid draft path'), { code: 'EINVAL' })
  }
  return d
}

export async function createDraft(): Promise<{ draftId: string }> {
  await mkdir(DRAFTS_ROOT, { recursive: true })
  const id = `d-${Date.now()}-${randomBytes(4).toString('hex')}`
  const dir = draftDir(id)
  await mkdir(join(dir, 'assets'), { recursive: true })
  return { draftId: id }
}

export async function deleteDraft(draftId: string): Promise<void> {
  if (!isValidDraftId(draftId)) {
    throw Object.assign(new Error('invalid draft id'), { code: 'EINVAL' })
  }
  const dir = draftDir(draftId)
  try {
    await rm(dir, { recursive: true, force: true })
  } catch {
    // 이미 없거나 다른 이유 — 무시
  }
}

export type DraftAssetResult = {
  filename: string
  relativePath: string
  mediaUrl: string
}

export async function saveDraftAsset(
  draftId: string,
  originalName: string,
  bytes: Uint8Array
): Promise<DraftAssetResult> {
  if (!isValidDraftId(draftId)) {
    throw Object.assign(new Error('invalid draft id'), { code: 'EINVAL' })
  }
  const dir = draftDir(draftId)
  const assets = join(dir, 'assets')
  await mkdir(assets, { recursive: true })
  const safe = sanitizeFilename(originalName)
  const finalName = await uniqueName(assets, safe)
  const absPath = resolve(assets, finalName)
  if (!absPath.startsWith(assets + sep)) {
    throw Object.assign(new Error('invalid path'), { code: 'EINVAL' })
  }
  await writeFile(absPath, bytes)
  return {
    filename: finalName,
    relativePath: `./assets/${finalName}`,
    mediaUrl: `/api/drafts/${draftId}/media/assets/${encodeURIComponent(finalName)}`
  }
}

export async function resolveDraftAssetPath(
  draftId: string,
  subSegs: string[]
): Promise<string> {
  if (!isValidDraftId(draftId)) {
    throw Object.assign(new Error('invalid draft id'), { code: 'EINVAL' })
  }
  if (subSegs.some((s) => s === '..' || s === '.')) {
    throw Object.assign(new Error('invalid path'), { code: 'EINVAL' })
  }
  const baseDir = draftDir(draftId)
  const absPath = resolve(baseDir, ...subSegs)
  if (!absPath.startsWith(baseDir + sep)) {
    throw Object.assign(new Error('invalid path'), { code: 'EINVAL' })
  }
  return absPath
}

export async function finalizeDraft(args: {
  draftId: string
  category: Category
  slug: string
  frontmatter: Record<string, unknown>
  content: string
}): Promise<{ filePath: string }> {
  if (!isValidDraftId(args.draftId)) {
    throw Object.assign(new Error('invalid draft id'), { code: 'EINVAL' })
  }
  const src = draftDir(args.draftId)
  try {
    const st = await stat(src)
    if (!st.isDirectory()) throw new Error('draft not a directory')
  } catch {
    throw Object.assign(new Error(`draft not found: ${args.draftId}`), { code: 'ENOENT' })
  }

  const catDir = categoryDir(args.category)
  await mkdir(catDir, { recursive: true })

  const destDir = resolve(catDir, args.slug)
  if (!destDir.startsWith(catDir + sep)) {
    throw Object.assign(new Error('invalid slug'), { code: 'EINVAL' })
  }
  try {
    await stat(destDir)
    throw Object.assign(new Error(`slug already exists: ${args.category}/${args.slug}`), {
      code: 'EEXIST'
    })
  } catch (e) {
    const err = e as NodeJS.ErrnoException
    if (err.code === 'EEXIST') throw err
    // ENOENT 는 정상 — 이어서 진행
  }

  // index.md 를 draft 폴더에 먼저 기록한 다음 rename (all-or-nothing)
  const raw = matter.stringify(args.content, args.frontmatter)
  await writeFile(join(src, 'index.md'), raw, 'utf8')
  await rename(src, destDir)

  return { filePath: `${args.category}/${args.slug}/index.md` }
}

export async function sweepOldDrafts(): Promise<number> {
  try {
    await mkdir(DRAFTS_ROOT, { recursive: true })
    const entries = await readdir(DRAFTS_ROOT, { withFileTypes: true })
    const now = Date.now()
    let removed = 0
    for (const e of entries) {
      if (!e.isDirectory()) continue
      if (!isValidDraftId(e.name)) continue
      const p = join(DRAFTS_ROOT, e.name)
      try {
        const st = await stat(p)
        if (now - st.mtimeMs > MAX_DRAFT_AGE_MS) {
          await rm(p, { recursive: true, force: true })
          removed++
        }
      } catch {
        // skip
      }
    }
    return removed
  } catch {
    return 0
  }
}

export function isUnderContents(abs: string): boolean {
  return abs === CONTENTS_ROOT || abs.startsWith(CONTENTS_ROOT + sep)
}
