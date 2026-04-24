import type {
  AnalyticsResult,
  AssetReport,
  BacklinkReport,
  BranchActionResult,
  BranchList,
  CIHistory,
  CIStatus,
  Category,
  CreateDraftResult,
  CreatePostBody,
  DeleteAssetsResult,
  DraftDoc,
  DraftsList,
  FinalizeDraftBody,
  FinalizeDraftResult,
  GitLog,
  LinkCheckResult,
  PingResponse,
  PostFull,
  PostMeta,
  Preset,
  PresetList,
  PublishResult,
  PublishStatus,
  SaveDraftBody,
  SavePostBody,
  SeriesReport,
  StatsReport,
  Taxonomy,
  UploadTarget
} from './types'

async function asJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status}: ${body || res.statusText}`)
  }
  return (await res.json()) as T
}

export async function ping(): Promise<PingResponse> {
  return asJson(await fetch('/api/ping'))
}

export async function listPosts(category: Category): Promise<PostMeta[]> {
  return asJson(await fetch(`/api/posts?category=${encodeURIComponent(category)}`))
}

export async function getTaxonomy(): Promise<Taxonomy> {
  return asJson(await fetch('/api/posts/taxonomy'))
}

export async function getPost(category: Category, slug: string): Promise<PostFull> {
  return asJson(await fetch(`/api/posts/${encodeURIComponent(category)}/${encodeURIComponent(slug)}`))
}

export async function savePost(
  category: Category,
  slug: string,
  body: SavePostBody
): Promise<PostFull> {
  return asJson(
    await fetch(`/api/posts/${encodeURIComponent(category)}/${encodeURIComponent(slug)}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    })
  )
}

export async function createPost(body: CreatePostBody): Promise<PostFull> {
  return asJson(
    await fetch(`/api/posts`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    })
  )
}

export async function trashPost(
  category: Category,
  slug: string
): Promise<{ ok: true; trashedPath: string }> {
  return asJson(
    await fetch(`/api/posts/${encodeURIComponent(category)}/${encodeURIComponent(slug)}`, {
      method: 'DELETE'
    })
  )
}

export async function movePost(
  fromCategory: Category,
  slug: string,
  toCategory: Category
): Promise<PostMeta> {
  return asJson(
    await fetch(
      `/api/posts/${encodeURIComponent(fromCategory)}/${encodeURIComponent(slug)}/move`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ toCategory })
      }
    )
  )
}

export async function getPublishStatus(): Promise<PublishStatus> {
  return asJson(await fetch('/api/publish/status'))
}

export async function getGitLog(limit = 50): Promise<GitLog> {
  return asJson(await fetch(`/api/publish/log?limit=${encodeURIComponent(String(limit))}`))
}

export async function publishCommit(body: {
  message: string
  push?: boolean
}): Promise<PublishResult> {
  return asJson(
    await fetch('/api/publish/commit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    })
  )
}

export async function getAnalyticsOverview(days: number): Promise<AnalyticsResult> {
  return asJson(await fetch(`/api/analytics/overview?days=${encodeURIComponent(String(days))}`))
}

export async function getCIStatus(): Promise<CIStatus> {
  return asJson(await fetch('/api/ci/latest'))
}

export async function getCIHistory(limit = 10): Promise<CIHistory> {
  return asJson(await fetch(`/api/ci/runs?limit=${encodeURIComponent(String(limit))}`))
}

export type UploadMediaResult = {
  filename: string
  relativePath: string
  mediaUrl: string
}

export async function uploadMedia(
  target: UploadTarget,
  file: File
): Promise<UploadMediaResult> {
  const fd = new FormData()
  fd.append('file', file, file.name)
  const url =
    target.type === 'post'
      ? `/api/media/${encodeURIComponent(target.category)}/${encodeURIComponent(target.slug)}`
      : `/api/drafts/${encodeURIComponent(target.draftId)}/assets`
  return asJson(await fetch(url, { method: 'POST', body: fd }))
}

export async function createDraft(): Promise<CreateDraftResult> {
  return asJson(await fetch('/api/drafts', { method: 'POST' }))
}

export async function listDrafts(): Promise<DraftsList> {
  return asJson(await fetch('/api/drafts'))
}

export async function getDraft(draftId: string): Promise<DraftDoc> {
  return asJson(await fetch(`/api/drafts/${encodeURIComponent(draftId)}`))
}

export async function saveDraft(draftId: string, body: SaveDraftBody): Promise<DraftDoc> {
  return asJson(
    await fetch(`/api/drafts/${encodeURIComponent(draftId)}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    })
  )
}

export async function deleteDraft(draftId: string): Promise<void> {
  await fetch(`/api/drafts/${encodeURIComponent(draftId)}`, {
    method: 'DELETE',
    keepalive: true
  }).catch(() => {})
}

export async function finalizeDraft(
  draftId: string,
  body: FinalizeDraftBody
): Promise<FinalizeDraftResult> {
  return asJson(
    await fetch(`/api/drafts/${encodeURIComponent(draftId)}/finalize`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    })
  )
}

export async function getAssetReport(): Promise<AssetReport> {
  return asJson(await fetch('/api/assets/report'))
}

export async function deleteAssets(paths: string[]): Promise<DeleteAssetsResult> {
  return asJson(
    await fetch('/api/assets', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ paths })
    })
  )
}

export async function getStats(): Promise<StatsReport> {
  return asJson(await fetch('/api/stats'))
}

export async function runLinkCheck(opts?: { external?: boolean }): Promise<LinkCheckResult> {
  const qs = opts?.external ? '?external=1' : ''
  return asJson(await fetch(`/api/links/check${qs}`))
}

export async function getSeries(): Promise<SeriesReport> {
  return asJson(await fetch('/api/series'))
}

export async function listPresets(): Promise<PresetList> {
  return asJson(await fetch('/api/presets'))
}

export async function savePreset(body: {
  id?: string
  name: string
  category: Category
  frontmatter: Record<string, unknown>
  body: string
}): Promise<Preset> {
  return asJson(
    await fetch('/api/presets', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    })
  )
}

export async function deletePreset(id: string): Promise<void> {
  await fetch(`/api/presets/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export async function getBacklinks(): Promise<BacklinkReport> {
  return asJson(await fetch('/api/backlinks'))
}

export async function listBranches(): Promise<BranchList> {
  return asJson(await fetch('/api/branches'))
}

export async function checkoutBranch(name: string): Promise<BranchActionResult> {
  return asJson(
    await fetch('/api/branches/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name })
    })
  )
}

export async function createBranch(name: string): Promise<BranchActionResult> {
  return asJson(
    await fetch('/api/branches', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name })
    })
  )
}

export async function deleteBranch(name: string, force = false): Promise<BranchActionResult> {
  return asJson(
    await fetch(`/api/branches/${encodeURIComponent(name)}?force=${force ? '1' : '0'}`, {
      method: 'DELETE'
    })
  )
}

export async function stashPush(message?: string): Promise<BranchActionResult> {
  return asJson(
    await fetch('/api/branches/stash', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: message ?? '' })
    })
  )
}

export async function stashPop(index: number): Promise<BranchActionResult> {
  return asJson(
    await fetch(`/api/branches/stash/${index}/pop`, { method: 'POST' })
  )
}

export async function stashDrop(index: number): Promise<BranchActionResult> {
  return asJson(
    await fetch(`/api/branches/stash/${index}`, { method: 'DELETE' })
  )
}
