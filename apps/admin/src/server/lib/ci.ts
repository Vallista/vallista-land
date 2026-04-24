const DEFAULT_REPO = 'Vallista/vallista-land'

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

export type CIStatus =
  | { configured: false; hint: string }
  | {
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

export type CIHistoryResult =
  | { configured: false; hint: string }
  | { configured: true; runs: CIRunSummary[] }

export async function fetchRunHistory(limit = 10): Promise<CIHistoryResult> {
  const token = process.env.GITHUB_TOKEN ?? ''
  const repo = process.env.GITHUB_REPO?.trim() || DEFAULT_REPO
  if (!token) {
    return {
      configured: false,
      hint: 'GITHUB_TOKEN을 apps/admin/.env.local에 추가하세요.'
    }
  }
  const per = Math.max(1, Math.min(30, Math.floor(limit) || 10))
  const url = `https://api.github.com/repos/${repo}/actions/runs?per_page=${per}`
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`GitHub API ${res.status}: ${body.slice(0, 200) || res.statusText}`)
  }
  const data = (await res.json()) as { workflow_runs?: Array<Record<string, unknown>> }
  const items = data.workflow_runs ?? []
  const runs: CIRunSummary[] = items.map((run) => {
    const head = run.head_commit as { message?: string } | null | undefined
    const actor = run.actor as { login?: string } | null | undefined
    const started = (run.run_started_at as string | null) ?? (run.created_at as string | null) ?? null
    const updated = (run.updated_at as string | null) ?? null
    const durationMs =
      started && updated ? Math.max(0, Date.parse(updated) - Date.parse(started)) : null
    return {
      runId: Number(run.id),
      runNumber: Number(run.run_number),
      status: (run.status as CIRunStatus) ?? 'unknown',
      conclusion: (run.conclusion as CIRunConclusion) ?? null,
      htmlUrl: String(run.html_url),
      headSha: String(run.head_sha),
      headBranch: (run.head_branch as string | null) ?? null,
      commitMessage: head?.message ?? null,
      workflowName: (run.name as string | null) ?? null,
      event: (run.event as string | null) ?? null,
      actor: actor?.login ?? null,
      startedAt: started,
      updatedAt: updated,
      durationMs
    }
  })
  return { configured: true, runs }
}

export async function fetchLatestRun(): Promise<CIStatus> {
  const token = process.env.GITHUB_TOKEN ?? ''
  const repo = process.env.GITHUB_REPO?.trim() || DEFAULT_REPO

  if (!token) {
    return {
      configured: false,
      hint:
        'GITHUB_TOKEN을 apps/admin/.env.local에 추가하세요. ' +
        'https://github.com/settings/tokens?type=beta 에서 권한 actions:read(Read-only)인 PAT를 발급받으면 됩니다.'
    }
  }

  const url = `https://api.github.com/repos/${repo}/actions/runs?per_page=1`
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`GitHub API ${res.status}: ${body.slice(0, 200) || res.statusText}`)
  }

  const data = (await res.json()) as { workflow_runs?: Array<Record<string, unknown>> }
  const run = data.workflow_runs?.[0]
  if (!run) {
    throw new Error(`No workflow runs found for ${repo}`)
  }

  const headCommit = run.head_commit as { message?: string } | null | undefined

  return {
    configured: true,
    status: (run.status as CIRunStatus) ?? 'unknown',
    conclusion: (run.conclusion as CIRunConclusion) ?? null,
    runId: Number(run.id),
    runNumber: Number(run.run_number),
    htmlUrl: String(run.html_url),
    headSha: String(run.head_sha),
    headBranch: (run.head_branch as string | null) ?? null,
    commitMessage: headCommit?.message ?? null,
    workflowName: (run.name as string | null) ?? null,
    startedAt:
      (run.run_started_at as string | null) ?? (run.created_at as string | null) ?? null,
    updatedAt: (run.updated_at as string | null) ?? null
  }
}
