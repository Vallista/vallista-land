export const CATEGORIES = ['articles', 'notes', 'projects'] as const
export type Category = (typeof CATEGORIES)[number]

export type PostStatus = 'published' | 'draft' | 'trashed'

export type PostMeta = {
  category: Category
  slug: string
  filePath: string
  title: string
  date: string | null
  tags: string[]
  draft: boolean
  status: PostStatus
  description: string | null
  image: string | null
  series: string | null
  updated: string | null
}

export type PostFull = PostMeta & {
  content: string
  rawSource: string
  hash: string
  data: Record<string, unknown>
}

export type SavePostBody = {
  frontmatter: Record<string, unknown>
  content: string
  expectedHash: string | null
}

export type CreatePostBody = {
  category: Category
  slug: string
  frontmatter: Record<string, unknown>
  content: string
}

export type PingResponse = {
  ok: boolean
  contentsRoot: string
  counts: Record<Category, number>
}

export type StatusEntry = {
  path: string
  index: string
  worktree: string
}

export type PublishStatus = {
  branch: string
  aheadOfRemote: number
  behindRemote: number
  entries: StatusEntry[]
  diffStat: string
}

export type PublishResult = {
  committed: boolean
  sha: string | null
  pushed: boolean
  pushOutput: string
  message: string
}

export type AnalyticsNotConfigured = {
  configured: false
  hint: string
}

export type AnalyticsOverview = {
  configured: true
  propertyId: string
  range: { startDate: string; endDate: string }
  totals: { pageViews: number; sessions: number; users: number }
  byDay: Array<{ date: string; pageViews: number; sessions: number; users: number }>
  topPages: Array<{ path: string; title: string; pageViews: number }>
  referers: Array<{ source: string; sessions: number }>
}

export type AnalyticsResult = AnalyticsOverview | AnalyticsNotConfigured

export const CATEGORY_LABEL: Record<Category, string> = {
  articles: '긴 글',
  notes: '짧은 글',
  projects: '프로젝트'
}

export type UploadTarget =
  | { type: 'post'; category: Category; slug: string }
  | { type: 'draft'; draftId: string }

export type CreateDraftResult = { draftId: string }

export type FinalizeDraftBody = {
  category: Category
  slug: string
  frontmatter: Record<string, unknown>
  content: string
}

export type FinalizeDraftResult = {
  category: Category
  slug: string
  filePath: string
}

export type TaxonomyCount = { value: string; count: number }
export type Taxonomy = {
  tags: TaxonomyCount[]
  series: TaxonomyCount[]
}

export type CIRunStatus = 'queued' | 'in_progress' | 'completed' | 'unknown'
export type CIRunConclusion =
  | 'success'
  | 'failure'
  | 'cancelled'
  | 'skipped'
  | 'timed_out'
  | 'action_required'
  | 'neutral'
  | 'startup_failure'
  | null

export type CIStatusConfigured = {
  configured: true
  status: CIRunStatus
  conclusion: CIRunConclusion
  runId: number
  runNumber: number
  htmlUrl: string
  headSha: string
  headBranch: string | null
  commitMessage: string | null
  workflowName: string | null
  startedAt: string | null
  updatedAt: string | null
}

export type CIStatusUnconfigured = {
  configured: false
  hint: string
}

export type CIStatus = CIStatusConfigured | CIStatusUnconfigured
