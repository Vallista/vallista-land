import { useEffect, useState } from 'react'
import { getGitLog, getPublishStatus, publishCommit } from '@/lib/api'
import type { GitLog, PublishResult, PublishStatus } from '@/lib/types'
import GitGraph from '@/components/GitGraph'
import CIHistory from '@/components/CIHistory'

function statusLabel(index: string, worktree: string): string {
  const code = `${index}${worktree}`.trim()
  if (code === 'M' || code === 'MM' || worktree === 'M') return '수정'
  if (code.startsWith('A') || index === 'A') return '추가'
  if (code.includes('D') || worktree === 'D') return '삭제'
  if (code.startsWith('R')) return '이름변경'
  if (code.startsWith('??')) return '미추적'
  return code || '변경'
}

export default function Publish() {
  const [status, setStatus] = useState<PublishStatus | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<PublishResult | null>(null)
  const [log, setLog] = useState<GitLog | null>(null)
  const [logErr, setLogErr] = useState<string | null>(null)

  const loadLog = () => {
    setLogErr(null)
    getGitLog(50)
      .then(setLog)
      .catch((e: unknown) => setLogErr(e instanceof Error ? e.message : String(e)))
  }

  const load = () => {
    setErr(null)
    setResult(null)
    setStatus(null)
    getPublishStatus()
      .then((s) => {
        setStatus(s)
        setMessage(suggestMessage(s))
      })
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : String(e)))
    loadLog()
  }

  useEffect(load, [])

  const onCommit = async (push: boolean) => {
    if (!status || status.entries.length === 0) return
    if (!message.trim()) {
      setErr('커밋 메시지를 입력해주세요.')
      return
    }
    const confirmMsg = push
      ? `${status.entries.length}개 변경사항을 커밋하고 origin/${status.branch}에 푸시합니다. main 푸시 시 GitHub Actions가 자동 배포합니다. 계속할까요?`
      : `${status.entries.length}개 변경사항을 커밋만 진행합니다(푸시 안 함). 계속할까요?`
    if (!window.confirm(confirmMsg)) return

    setBusy(true)
    setErr(null)
    try {
      const r = await publishCommit({ message: message.trim(), push })
      setResult(r)
      const refreshed = await getPublishStatus()
      setStatus(refreshed)
      loadLog()
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  if (err && !status) return <div className="err">오류: {err}</div>
  if (!status) return <div className="muted">상태 확인 중…</div>

  const clean = status.entries.length === 0
  const isMain = status.branch === 'main'

  return (
    <div>
      <header className="page-head page-head--row">
        <div>
          <h1>배포</h1>
          <div className="muted small meta-line">
            <span>브랜치: <code>{status.branch}</code></span>
            <span>·</span>
            <span>
              ahead {status.aheadOfRemote} / behind {status.behindRemote}
            </span>
          </div>
        </div>
        <button type="button" className="btn btn--ghost" onClick={load} disabled={busy}>
          새로고침
        </button>
      </header>

      {!isMain && (
        <div className="err" style={{ marginBottom: 12 }}>
          현재 브랜치가 <code>main</code>이 아닙니다. 푸시 시 자동 배포가 트리거되지 않을 수 있습니다.
        </div>
      )}

      <section className="card" style={{ marginBottom: 16 }}>
        <h2>변경된 파일 ({status.entries.length})</h2>
        {clean ? (
          <p className="muted">
            <code>contents/</code>에 변경사항이 없습니다.
          </p>
        ) : (
          <table className="posts-table">
            <thead>
              <tr>
                <th>유형</th>
                <th>경로</th>
              </tr>
            </thead>
            <tbody>
              {status.entries.map((e) => (
                <tr key={e.path}>
                  <td>
                    <span className="tag">{statusLabel(e.index, e.worktree)}</span>
                  </td>
                  <td className="small">
                    <code>{e.path}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {status.diffStat && (
        <section className="card" style={{ marginBottom: 16 }}>
          <h2>diff --stat</h2>
          <pre className="diff-stat">{status.diffStat}</pre>
        </section>
      )}

      <section className="card">
        <h2>커밋 메시지</h2>
        <textarea
          className="commit-msg"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="예: content(articles): …"
          disabled={clean || busy}
        />
        <div className="edit-actions" style={{ marginTop: 12 }}>
          <button
            type="button"
            className="btn"
            onClick={() => void onCommit(true)}
            disabled={clean || busy}
          >
            {busy ? '진행 중…' : '커밋 + 푸시 (배포)'}
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => void onCommit(false)}
            disabled={clean || busy}
          >
            커밋만 (푸시 없이)
          </button>
        </div>
      </section>

      {err && (
        <div className="err" style={{ marginTop: 16 }}>
          오류: {err}
        </div>
      )}
      <section className="card" style={{ marginTop: 16 }}>
        <h2>GitHub Actions 히스토리</h2>
        <CIHistory />
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14
          }}
        >
          <h2 style={{ margin: 0 }}>최근 커밋</h2>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={loadLog}
            disabled={busy}
          >
            새로고침
          </button>
        </div>
        {logErr ? (
          <p className="err">오류: {logErr}</p>
        ) : !log ? (
          <p className="muted">불러오는 중…</p>
        ) : (
          <GitGraph commits={log.commits} />
        )}
      </section>

      {result && (
        <section className="card" style={{ marginTop: 16 }}>
          <h2>결과</h2>
          {result.committed ? (
            <dl>
              <dt>커밋</dt>
              <dd><code>{result.sha?.slice(0, 10) ?? '-'}</code></dd>
              <dt>메시지</dt>
              <dd>{result.message}</dd>
              <dt>푸시</dt>
              <dd>
                {result.pushed ? (
                  <span className="status status--published">성공</span>
                ) : (
                  <span className="status status--draft">미실행</span>
                )}
              </dd>
              {result.pushOutput && (
                <>
                  <dt>출력</dt>
                  <dd>
                    <pre className="diff-stat">{result.pushOutput}</pre>
                  </dd>
                </>
              )}
            </dl>
          ) : (
            <p className="muted">{result.message}</p>
          )}
        </section>
      )}
    </div>
  )
}

function suggestMessage(s: PublishStatus): string {
  const types = new Set<string>()
  const cats = new Set<string>()
  for (const e of s.entries) {
    if (!e.path.startsWith('contents/')) continue
    const rest = e.path.slice('contents/'.length)
    const cat = rest.split('/')[0]
    if (cat) cats.add(cat)
    types.add(statusLabel(e.index, e.worktree))
  }
  const verb = types.has('추가')
    ? 'add'
    : types.has('삭제')
      ? 'remove'
      : 'update'
  const scope = cats.size === 1 ? [...cats][0] : 'content'
  return `content(${scope}): ${verb} ${s.entries.length} file${s.entries.length === 1 ? '' : 's'}`
}
