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

export type GitCommit = {
  sha: string
  shortSha: string
  parents: string[]
  subject: string
  authorName: string
  authorEmail: string
  authorDate: string
  refs: string[]
}

export type GitLog = {
  commits: GitCommit[]
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

export type DraftSummary = {
  draftId: string
  category: Category | null
  slug: string
  title: string
  updatedAt: string
  createdAt: string
  sizeBytes: number
  assetCount: number
}

export type DraftsList = {
  items: DraftSummary[]
}

export type AssetEntry = {
  category: Category
  postSlug: string
  filename: string
  relPath: string
  sizeBytes: number
  referenced: boolean
  referencedBy: string[]
}

export type AssetReport = {
  totalBytes: number
  orphanBytes: number
  items: AssetEntry[]
  byCategory: Array<{ category: Category; bytes: number; count: number; orphans: number }>
}

export type DeleteAssetsResult = {
  deleted: number
  errors: Array<{ path: string; error: string }>
}

export type StatsMonthlyPoint = { month: string; count: number }
export type StatsTagEntry = { tag: string; count: number }
export type StatsReport = {
  totalPosts: number
  totalWords: number
  avgWords: number
  byCategory: Array<{ category: Category; count: number; words: number }>
  monthly: StatsMonthlyPoint[]
  tags: StatsTagEntry[]
  longest: Array<{ category: Category; slug: string; title: string; words: number }>
  shortest: Array<{ category: Category; slug: string; title: string; words: number }>
}

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

export type SeriesEntry = {
  name: string
  category: Category
  posts: Array<{
    slug: string
    title: string
    date: string | null
    order: number | null
  }>
}

export type SeriesReport = {
  items: SeriesEntry[]
}

export type Preset = {
  id: string
  name: string
  category: Category
  frontmatter: Record<string, unknown>
  body: string
  updatedAt: string
}

export type PresetList = {
  items: Preset[]
}

export type BacklinkEdge = {
  from: { category: Category; slug: string; title: string }
  to: { category: Category; slug: string; title: string }
  target: string
}

export type BacklinkReport = {
  edges: BacklinkEdge[]
  byPost: Array<{
    category: Category
    slug: string
    title: string
    incoming: number
    outgoing: number
  }>
}

export type BranchInfo = {
  name: string
  current: boolean
  upstream: string | null
  ahead: number
  behind: number
  lastCommit: string | null
  lastCommitDate: string | null
}

export type BranchList = {
  branches: BranchInfo[]
  stashes: Array<{ index: number; subject: string }>
}

export type BranchActionResult = {
  ok: boolean
  output: string
}

export type DraftDoc = {
  draftId: string
  category: Category | null
  slug: string
  title: string
  frontmatter: Record<string, unknown>
  content: string
  updatedAt: string
}

export type SaveDraftBody = {
  category: Category | null
  slug: string
  title: string
  frontmatter: Record<string, unknown>
  content: string
}

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

export type CIRunSummary = {
  runId: number
  runNumber: number
  status: CIRunStatus
  conclusion: CIRunConclusion
  htmlUrl: string
  headSha: string
  headBranch: string | null
  commitMessage: string | null
  workflowName: string | null
  event: string | null
  actor: string | null
  startedAt: string | null
  updatedAt: string | null
  durationMs: number | null
}

export type CIHistory =
  | { configured: false; hint: string }
  | { configured: true; runs: CIRunSummary[] }
