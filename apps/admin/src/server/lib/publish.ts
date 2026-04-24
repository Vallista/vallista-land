import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { REPO_ROOT } from '../paths'

const execFileP = promisify(execFile)

type GitOpts = { timeoutMs?: number }

async function git(args: string[], opts: GitOpts = {}): Promise<string> {
  const { stdout } = await execFileP('git', ['-C', REPO_ROOT, ...args], {
    timeout: opts.timeoutMs ?? 20_000,
    maxBuffer: 8 * 1024 * 1024
  })
  return stdout
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

export async function getPublishStatus(): Promise<PublishStatus> {
  const [branchRaw, aheadBehindRaw, porcelain, diffStat] = await Promise.all([
    git(['rev-parse', '--abbrev-ref', 'HEAD']).catch(() => 'HEAD\n'),
    git(['rev-list', '--left-right', '--count', 'HEAD...@{u}']).catch(() => '0\t0\n'),
    git(['status', '--porcelain=1', '--', 'contents/']),
    git(['diff', '--stat', 'HEAD', '--', 'contents/']).catch(() => '')
  ])

  const branch = branchRaw.trim()
  const [aheadStr, behindStr] = aheadBehindRaw.trim().split(/\s+/)
  const aheadOfRemote = Number(aheadStr) || 0
  const behindRemote = Number(behindStr) || 0

  const entries: StatusEntry[] = []
  for (const line of porcelain.split('\n')) {
    if (!line) continue
    const index = line[0]
    const worktree = line[1]
    const path = line.slice(3)
    entries.push({ index, worktree, path })
  }

  return { branch, aheadOfRemote, behindRemote, entries, diffStat }
}

export type PublishResult = {
  committed: boolean
  sha: string | null
  pushed: boolean
  pushOutput: string
  message: string
}

export type GitCommitInfo = {
  sha: string
  shortSha: string
  parents: string[]
  subject: string
  authorName: string
  authorEmail: string
  authorDate: string
  refs: string[]
}

const LOG_FIELD_SEP = '\x1f'
const LOG_RECORD_SEP = '\x1e'
const LOG_FORMAT = [
  '%H',
  '%P',
  '%s',
  '%an',
  '%ae',
  '%aI',
  '%D'
].join(LOG_FIELD_SEP) + LOG_RECORD_SEP

export async function getGitLog(limit: number): Promise<GitCommitInfo[]> {
  const n = Math.max(1, Math.min(200, Math.floor(limit) || 50))
  const out = await git(['log', `-n`, String(n), `--format=${LOG_FORMAT}`])
  const commits: GitCommitInfo[] = []
  for (const raw of out.split(LOG_RECORD_SEP)) {
    const line = raw.replace(/^\n+/, '')
    if (!line.trim()) continue
    const parts = line.split(LOG_FIELD_SEP)
    if (parts.length < 7) continue
    const [sha, parents, subject, an, ae, aI, refs] = parts
    commits.push({
      sha,
      shortSha: sha.slice(0, 7),
      parents: parents.split(' ').map((s) => s.trim()).filter(Boolean),
      subject,
      authorName: an,
      authorEmail: ae,
      authorDate: aI,
      refs: refs
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean)
    })
  }
  return commits
}

export async function publishCommit(args: {
  message: string
  push: boolean
}): Promise<PublishResult> {
  const msg = args.message.trim()
  if (!msg) {
    const err = new Error('commit message is empty')
    ;(err as Error & { code?: string }).code = 'EINVAL'
    throw err
  }

  const status = await getPublishStatus()
  if (status.entries.length === 0) {
    return {
      committed: false,
      sha: null,
      pushed: false,
      pushOutput: '',
      message: 'no changes in contents/'
    }
  }

  await git(['add', '--', 'contents/'])
  await git(['commit', '-m', msg])

  const shaRaw = await git(['rev-parse', 'HEAD'])
  const sha = shaRaw.trim()

  let pushed = false
  let pushOutput = ''
  if (args.push) {
    try {
      pushOutput = await git(['push', 'origin', status.branch], { timeoutMs: 60_000 })
      pushed = true
    } catch (e) {
      pushOutput = e instanceof Error ? e.message : String(e)
      pushed = false
    }
  }

  return { committed: true, sha, pushed, pushOutput, message: msg }
}
