import { useEffect, useRef, useState } from 'react'
import { getCIStatus } from '@/lib/api'
import type { CIStatus, CIStatusConfigured } from '@/lib/types'

const POLL_ACTIVE_MS = 5000
const POLL_IDLE_MS = 60_000
const FADE_AFTER_SUCCESS_MS = 10_000

type DisplayState =
  | { kind: 'hidden' }
  | { kind: 'configured'; data: CIStatusConfigured; dismissed: boolean }
  | { kind: 'unconfigured'; hint: string; dismissed: boolean }
  | { kind: 'error'; message: string; dismissed: boolean }

export default function CIStatusBar() {
  const [state, setState] = useState<DisplayState>({ kind: 'hidden' })
  const [now, setNow] = useState(() => Date.now())
  const lastSuccessShownAtRef = useRef<number | null>(null)
  const lastRunIdRef = useRef<number | null>(null)

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | null = null

    async function tick() {
      try {
        const data: CIStatus = await getCIStatus()
        if (cancelled) return
        if (!data.configured) {
          setState((prev) => ({
            kind: 'unconfigured',
            hint: data.hint,
            dismissed: prev.kind === 'unconfigured' ? prev.dismissed : false
          }))
        } else {
          setState((prev) => {
            const sameRun =
              prev.kind === 'configured' && prev.data.runId === data.runId
            const dismissed = sameRun ? prev.dismissed : false
            if (lastRunIdRef.current !== data.runId) {
              lastRunIdRef.current = data.runId
              lastSuccessShownAtRef.current = null
            }
            if (data.status === 'completed' && data.conclusion === 'success') {
              if (lastSuccessShownAtRef.current === null) {
                lastSuccessShownAtRef.current = Date.now()
              }
            }
            return { kind: 'configured', data, dismissed }
          })
        }
      } catch (e) {
        if (cancelled) return
        const message = (e as Error).message
        setState((prev) => ({
          kind: 'error',
          message,
          dismissed: prev.kind === 'error' ? prev.dismissed : false
        }))
      } finally {
        if (cancelled) return
        const interval = pickInterval(state)
        timer = setTimeout(tick, interval)
      }
    }

    void tick()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
    // 한 번만 시작. 내부 setTimeout이 재귀 호출하며 상태에 따라 간격 조정.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (state.kind !== 'configured') return
    if (state.data.status !== 'in_progress' && state.data.status !== 'queued') return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [state])

  if (state.kind === 'hidden') return null
  if (state.kind === 'unconfigured') {
    if (state.dismissed) return null
    return (
      <div className="ci-bar ci-bar--muted">
        <span className="ci-bar__dot ci-bar__dot--muted" />
        <span className="ci-bar__text">CI 상태 표시 비활성: GITHUB_TOKEN 미설정</span>
        <button
          className="ci-bar__close"
          onClick={() => setState({ ...state, dismissed: true })}
          aria-label="닫기"
        >
          ×
        </button>
      </div>
    )
  }
  if (state.kind === 'error') {
    if (state.dismissed) return null
    return (
      <div className="ci-bar ci-bar--err">
        <span className="ci-bar__dot ci-bar__dot--err" />
        <span className="ci-bar__text">CI 상태 조회 실패: {state.message}</span>
        <button
          className="ci-bar__close"
          onClick={() => setState({ ...state, dismissed: true })}
          aria-label="닫기"
        >
          ×
        </button>
      </div>
    )
  }

  const { data, dismissed } = state
  const isRunning = data.status === 'in_progress' || data.status === 'queued'
  const isSuccess = data.status === 'completed' && data.conclusion === 'success'
  const isFailure =
    data.status === 'completed' &&
    data.conclusion !== null &&
    data.conclusion !== 'success' &&
    data.conclusion !== 'skipped' &&
    data.conclusion !== 'neutral'

  if (dismissed) return null
  if (
    isSuccess &&
    lastSuccessShownAtRef.current !== null &&
    now - lastSuccessShownAtRef.current > FADE_AFTER_SUCCESS_MS
  ) {
    return null
  }
  if (data.status === 'completed' && !isSuccess && !isFailure) return null

  const variant = isRunning ? 'run' : isSuccess ? 'ok' : 'err'
  const elapsed = formatElapsed(data.startedAt, now)
  const sha = data.headSha.slice(0, 7)
  const firstLine = (data.commitMessage ?? '').split('\n')[0] || '(메시지 없음)'

  return (
    <a
      className={`ci-bar ci-bar--${variant}`}
      href={data.htmlUrl}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => {
        const w = window as unknown as { electron?: { openExternal?: (u: string) => void } }
        if (w.electron?.openExternal) {
          e.preventDefault()
          w.electron.openExternal(data.htmlUrl)
        }
      }}
    >
      <span className={`ci-bar__dot ci-bar__dot--${variant}`} />
      <span className="ci-bar__text">
        <strong>
          {isRunning ? '배포 중' : isSuccess ? '배포 성공' : '배포 실패'}
        </strong>
        <span className="ci-bar__sep">·</span>
        <span className="ci-bar__msg" title={firstLine}>
          {firstLine}
        </span>
        <span className="ci-bar__meta">
          {sha} · #{data.runNumber}
          {elapsed ? ` · ${elapsed}` : ''}
        </span>
      </span>
      <button
        className="ci-bar__close"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setState({ ...state, dismissed: true })
        }}
        aria-label="닫기"
      >
        ×
      </button>
    </a>
  )
}

function pickInterval(state: DisplayState): number {
  if (state.kind === 'configured') {
    if (state.data.status === 'in_progress' || state.data.status === 'queued') {
      return POLL_ACTIVE_MS
    }
  }
  return POLL_IDLE_MS
}

function formatElapsed(startedAt: string | null, now: number): string | null {
  if (!startedAt) return null
  const start = Date.parse(startedAt)
  if (Number.isNaN(start)) return null
  const sec = Math.max(0, Math.floor((now - start) / 1000))
  if (sec < 60) return `${sec}s`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}m ${s.toString().padStart(2, '0')}s`
}
