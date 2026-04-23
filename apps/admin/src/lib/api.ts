import type {
  AnalyticsResult,
  Category,
  CreateDraftResult,
  CreatePostBody,
  FinalizeDraftBody,
  FinalizeDraftResult,
  PingResponse,
  PostFull,
  PostMeta,
  PublishResult,
  PublishStatus,
  SavePostBody,
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
