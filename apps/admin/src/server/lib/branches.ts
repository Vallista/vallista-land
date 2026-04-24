import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { REPO_ROOT } from '../paths'

const execFileP = promisify(execFile)

async function git(args: string[], timeoutMs = 20_000): Promise<{ stdout: string; stderr: string }> {
  const { stdout, stderr } = await execFileP('git', ['-C', REPO_ROOT, ...args], {
    timeout: timeoutMs,
    maxBuffer: 8 * 1024 * 1024
  })
  return { stdout, stderr }
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

function isValidBranchName(name: string): boolean {
  if (!name) return false
  if (name.length > 200) return false
  if (/[\s~^:?*[\\]/.test(name)) return false
  if (name.startsWith('-')) return false
  if (name.includes('..')) return false
  if (name.includes('//')) return false
  return true
}

export async function listBranches(): Promise<BranchList> {
  const fmt = [
    '%(refname:short)',
    '%(HEAD)',
    '%(upstream:short)',
    '%(upstream:track)',
    '%(objectname:short)',
    '%(committerdate:iso-strict)'
  ].join('%09')

  const { stdout } = await git(['for-each-ref', `--format=${fmt}`, 'refs/heads/'])
  const branches: BranchInfo[] = []
  for (const line of stdout.split('\n')) {
    if (!line) continue
    const [name, head, upstream, track, obj, date] = line.split('\t')
    let ahead = 0
    let behind = 0
    if (track) {
      const a = track.match(/ahead (\d+)/)
      const b = track.match(/behind (\d+)/)
      if (a) ahead = Number(a[1])
      if (b) behind = Number(b[1])
    }
    branches.push({
      name,
      current: head.trim() === '*',
      upstream: upstream || null,
      ahead,
      behind,
      lastCommit: obj || null,
      lastCommitDate: date || null
    })
  }

  branches.sort((a, b) => {
    if (a.current !== b.current) return a.current ? -1 : 1
    return (b.lastCommitDate ?? '').localeCompare(a.lastCommitDate ?? '')
  })

  const stashes: BranchList['stashes'] = []
  try {
    const { stdout: sraw } = await git(['stash', 'list', '--pretty=%gd%09%s'])
    for (const line of sraw.split('\n')) {
      if (!line) continue
      const [ref, ...rest] = line.split('\t')
      const m = ref.match(/stash@\{(\d+)\}/)
      if (!m) continue
      stashes.push({ index: Number(m[1]), subject: rest.join('\t') })
    }
  } catch {
    // stash 명령 실패 시 생략
  }

  return { branches, stashes }
}

async function workingTreeClean(): Promise<boolean> {
  const { stdout } = await git(['status', '--porcelain=1'])
  return stdout.trim().length === 0
}

export async function checkoutBranch(name: string): Promise<BranchActionResult> {
  if (!isValidBranchName(name)) {
    throw Object.assign(new Error('invalid branch name'), { code: 'EINVAL' })
  }
  if (!(await workingTreeClean())) {
    throw Object.assign(
      new Error('작업 트리에 커밋되지 않은 변경이 있습니다. 먼저 커밋하거나 stash push 하세요.'),
      { code: 'EDIRTY' }
    )
  }
  try {
    const { stdout, stderr } = await git(['checkout', name])
    return { ok: true, output: [stdout, stderr].filter(Boolean).join('\n').trim() }
  } catch (e) {
    const err = e as Error
    throw Object.assign(new Error(err.message), { code: 'EGIT' })
  }
}

export async function createBranch(name: string): Promise<BranchActionResult> {
  if (!isValidBranchName(name)) {
    throw Object.assign(new Error('invalid branch name'), { code: 'EINVAL' })
  }
  if (!(await workingTreeClean())) {
    throw Object.assign(
      new Error('작업 트리에 커밋되지 않은 변경이 있습니다. 먼저 커밋하거나 stash push 하세요.'),
      { code: 'EDIRTY' }
    )
  }
  const { stdout, stderr } = await git(['checkout', '-b', name])
  return { ok: true, output: [stdout, stderr].filter(Boolean).join('\n').trim() }
}

export async function deleteBranch(name: string, force: boolean): Promise<BranchActionResult> {
  if (!isValidBranchName(name)) {
    throw Object.assign(new Error('invalid branch name'), { code: 'EINVAL' })
  }
  if (['main', 'master'].includes(name)) {
    throw Object.assign(new Error('보호 브랜치는 삭제할 수 없습니다.'), { code: 'EPROTECTED' })
  }
  const args = ['branch', force ? '-D' : '-d', name]
  const { stdout, stderr } = await git(args)
  return { ok: true, output: [stdout, stderr].filter(Boolean).join('\n').trim() }
}

export async function stashPush(message: string): Promise<BranchActionResult> {
  const args = message ? ['stash', 'push', '-m', message] : ['stash', 'push']
  const { stdout, stderr } = await git(args)
  return { ok: true, output: [stdout, stderr].filter(Boolean).join('\n').trim() }
}

export async function stashPop(index: number): Promise<BranchActionResult> {
  if (!Number.isInteger(index) || index < 0) {
    throw Object.assign(new Error('invalid stash index'), { code: 'EINVAL' })
  }
  const { stdout, stderr } = await git(['stash', 'pop', `stash@{${index}}`])
  return { ok: true, output: [stdout, stderr].filter(Boolean).join('\n').trim() }
}

export async function stashDrop(index: number): Promise<BranchActionResult> {
  if (!Number.isInteger(index) || index < 0) {
    throw Object.assign(new Error('invalid stash index'), { code: 'EINVAL' })
  }
  const { stdout, stderr } = await git(['stash', 'drop', `stash@{${index}}`])
  return { ok: true, output: [stdout, stderr].filter(Boolean).join('\n').trim() }
}
