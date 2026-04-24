import { useMemo } from 'react'
import type { GitCommit } from '@/lib/types'

type LaidNode = {
  commit: GitCommit
  row: number
  lane: number
  parents: { sha: string; lane: number | null; row: number | null }[]
}

type Layout = { nodes: LaidNode[]; width: number }

const LANE_COLORS = [
  'var(--blue)',
  '#b88aff',
  '#ff8aa8',
  '#7ad3a6',
  '#f2a75d',
  '#5ec7d0',
  '#c6c06a'
]

function laneColor(lane: number): string {
  return LANE_COLORS[lane % LANE_COLORS.length]
}

function layoutCommits(commits: GitCommit[]): Layout {
  const indexBySha = new Map<string, number>()
  commits.forEach((c, i) => indexBySha.set(c.sha, i))

  const active: (string | null)[] = []
  const nodes: LaidNode[] = []

  for (let i = 0; i < commits.length; i++) {
    const c = commits[i]
    let lane = active.indexOf(c.sha)
    if (lane < 0) {
      lane = active.findIndex((x) => x === null)
      if (lane < 0) {
        lane = active.length
        active.push(null)
      }
    }
    active[lane] = c.sha

    for (let k = 0; k < active.length; k++) {
      if (k !== lane && active[k] === c.sha) active[k] = null
    }

    const laidParents: LaidNode['parents'] = []
    if (c.parents.length === 0) {
      active[lane] = null
    } else {
      active[lane] = c.parents[0]
    }

    for (let pi = 0; pi < c.parents.length; pi++) {
      const psha = c.parents[pi]
      if (pi === 0) {
        laidParents.push({
          sha: psha,
          lane,
          row: indexBySha.get(psha) ?? null
        })
      } else {
        let plane = active.indexOf(psha)
        if (plane < 0) {
          plane = active.findIndex((x) => x === null)
          if (plane < 0) {
            plane = active.length
            active.push(null)
          }
          active[plane] = psha
        }
        laidParents.push({
          sha: psha,
          lane: plane,
          row: indexBySha.get(psha) ?? null
        })
      }
    }

    nodes.push({ commit: c, row: i, lane, parents: laidParents })

    while (active.length > 0 && active[active.length - 1] === null) active.pop()
  }

  let width = 0
  for (const n of nodes) {
    if (n.lane + 1 > width) width = n.lane + 1
    for (const p of n.parents) {
      if (p.lane !== null && p.lane + 1 > width) width = p.lane + 1
    }
  }
  return { nodes, width }
}

function formatDate(iso: string): string {
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return iso
  const d = new Date(t)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`
}

type RefBadge = { label: string; kind: 'head' | 'local' | 'remote' | 'tag' }

function parseRefs(refs: string[]): RefBadge[] {
  const out: RefBadge[] = []
  for (const raw of refs) {
    const s = raw.trim()
    if (!s) continue
    if (s.startsWith('HEAD -> ')) {
      out.push({ label: 'HEAD', kind: 'head' })
      out.push({ label: s.slice('HEAD -> '.length), kind: 'local' })
    } else if (s === 'HEAD') {
      out.push({ label: 'HEAD', kind: 'head' })
    } else if (s.startsWith('tag: ')) {
      out.push({ label: s.slice('tag: '.length), kind: 'tag' })
    } else if (s.includes('/')) {
      out.push({ label: s, kind: 'remote' })
    } else {
      out.push({ label: s, kind: 'local' })
    }
  }
  return out
}

const ROW_HEIGHT = 40
const LANE_WIDTH = 18
const DOT_RADIUS = 4.5

export default function GitGraph({ commits }: { commits: GitCommit[] }) {
  const { nodes, width } = useMemo(() => layoutCommits(commits), [commits])

  if (nodes.length === 0) {
    return <p className="muted">커밋 히스토리가 없습니다.</p>
  }

  const laneCount = Math.max(1, width)
  const graphWidth = laneCount * LANE_WIDTH + 6
  const totalHeight = nodes.length * ROW_HEIGHT

  return (
    <div className="git-log">
      <div className="git-log__graph-col" style={{ width: graphWidth, height: totalHeight }}>
        <svg
          width={graphWidth}
          height={totalHeight}
          className="git-log__svg"
          aria-hidden="true"
        >
          {nodes.flatMap((n) =>
            n.parents.map((p) => {
              if (p.lane === null || p.row === null) return null
              const x1 = n.lane * LANE_WIDTH + LANE_WIDTH / 2
              const y1 = n.row * ROW_HEIGHT + ROW_HEIGHT / 2
              const x2 = p.lane * LANE_WIDTH + LANE_WIDTH / 2
              const y2 = p.row * ROW_HEIGHT + ROW_HEIGHT / 2
              const color = laneColor(p.lane === n.lane ? n.lane : p.lane)
              if (x1 === x2) {
                return (
                  <line
                    key={`${n.commit.sha}-${p.sha}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={color}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    opacity={0.7}
                  />
                )
              }
              const midY = y1 + (y2 - y1) / 2
              const d = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`
              return (
                <path
                  key={`${n.commit.sha}-${p.sha}`}
                  d={d}
                  fill="none"
                  stroke={color}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  opacity={0.7}
                />
              )
            })
          )}
          {nodes.map((n) => (
            <circle
              key={n.commit.sha}
              cx={n.lane * LANE_WIDTH + LANE_WIDTH / 2}
              cy={n.row * ROW_HEIGHT + ROW_HEIGHT / 2}
              r={DOT_RADIUS}
              fill={laneColor(n.lane)}
              stroke="var(--bg)"
              strokeWidth={1.5}
            />
          ))}
        </svg>
      </div>
      <div className="git-log__rows">
        {nodes.map((n) => {
          const badges = parseRefs(n.commit.refs)
          return (
            <div
              key={n.commit.sha}
              className="git-log__row"
              style={{ height: ROW_HEIGHT }}
              title={n.commit.sha}
            >
              <code className="git-log__sha">{n.commit.shortSha}</code>
              <span className="git-log__subject">{n.commit.subject}</span>
              {badges.length > 0 && (
                <span className="git-log__refs">
                  {badges.map((b, i) => (
                    <span key={`${b.label}-${i}`} className={`git-log__ref git-log__ref--${b.kind}`}>
                      {b.label}
                    </span>
                  ))}
                </span>
              )}
              <span className="git-log__author">{n.commit.authorName}</span>
              <span className="git-log__date">{formatDate(n.commit.authorDate)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
