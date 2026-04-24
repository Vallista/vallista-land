import { useEffect, useState } from 'react'
import { getCIHistory } from '@/lib/api'
import type { CIHistory, CIRunSummary } from '@/lib/types'

function dot(run: CIRunSummary): string {
  if (run.status !== 'completed') return 'ci-dot--running'
  if (run.conclusion === 'success') return 'ci-dot--success'
  if (run.conclusion === 'failure' || run.conclusion === 'startup_failure') return 'ci-dot--fail'
  if (run.conclusion === 'cancelled') return 'ci-dot--cancel'
  return 'ci-dot--neutral'
}

function label(run: CIRunSummary): string {
  if (run.status !== 'completed') return run.status
  return run.conclusion ?? 'unknown'
}

function timeAgo(iso: string | null): string {
  if (!iso) return '-'
  const ms = Date.now() - Date.parse(iso)
  if (!Number.isFinite(ms)) return iso
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  return `${d}d`
}

function dur(ms: number | null): string {
  if (ms === null) return '-'
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const rem = s - m * 60
  return rem ? `${m}m ${rem}s` : `${m}m`
}

export default function CIHistory() {
  const [data, setData] = useState<CIHistory | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const load = () => {
    setErr(null)
    getCIHistory(10)
      .then(setData)
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : String(e)))
  }

  useEffect(load, [])

  if (err) return <p className="err">오류: {err}</p>
  if (!data) return <p className="muted">불러오는 중…</p>
  if (!data.configured) return <p className="muted">{data.hint}</p>
  if (data.runs.length === 0) return <p className="muted">최근 실행 내역이 없습니다.</p>

  return (
    <ul className="ci-history">
      {data.runs.map((r) => (
        <li key={r.runId} className="ci-history__row">
          <span className={`ci-dot ${dot(r)}`} />
          <a href={r.htmlUrl} target="_blank" rel="noreferrer" className="ci-history__link">
            <span className="ci-history__num">#{r.runNumber}</span>
            <span className="ci-history__msg">
              {r.commitMessage ? r.commitMessage.split('\n')[0] : r.headSha.slice(0, 7)}
            </span>
          </a>
          <span className="ci-history__branch">{r.headBranch ?? '-'}</span>
          <span className="ci-history__conc">{label(r)}</span>
          <span className="ci-history__dur">{dur(r.durationMs)}</span>
          <span className="ci-history__ago">{timeAgo(r.startedAt)}</span>
        </li>
      ))}
    </ul>
  )
}
