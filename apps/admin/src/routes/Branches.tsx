import { useCallback, useEffect, useState } from 'react'
import {
  checkoutBranch,
  createBranch,
  deleteBranch,
  listBranches,
  stashDrop,
  stashPop,
  stashPush
} from '@/lib/api'
import type { BranchList } from '@/lib/types'

function fmtDate(iso: string | null): string {
  if (!iso) return '-'
  return iso.slice(0, 16).replace('T', ' ')
}

export default function Branches() {
  const [data, setData] = useState<BranchList | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [stashMsg, setStashMsg] = useState('')

  const load = useCallback(() => {
    setErr(null)
    listBranches()
      .then(setData)
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : String(e)))
  }, [])

  useEffect(load, [load])

  const run = async (action: () => Promise<{ output?: string }>) => {
    setBusy(true)
    setErr(null)
    setMsg(null)
    try {
      const result = await action()
      if (result.output) setMsg(result.output)
      load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <header className="page-head">
        <h1>브랜치</h1>
        <p className="muted small">로컬 Git 브랜치·스태시 관리</p>
      </header>

      {err && <div className="err">오류: {err}</div>}
      {msg && (
        <div className="card" style={{ marginBottom: 12 }}>
          <pre className="diff-stat" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
            {msg}
          </pre>
        </div>
      )}

      <section className="card" style={{ marginBottom: 16 }}>
        <h2>새 브랜치</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="input"
            type="text"
            placeholder="feature/my-branch"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{ flex: 1 }}
          />
          <button
            type="button"
            className="btn"
            disabled={busy || !newName.trim()}
            onClick={() =>
              run(async () => {
                const r = await createBranch(newName.trim())
                setNewName('')
                return r
              })
            }
          >
            생성 + 체크아웃
          </button>
        </div>
        <p className="muted small" style={{ marginTop: 6 }}>
          작업 트리가 깨끗해야 체크아웃됩니다.
        </p>
      </section>

      <section className="card" style={{ marginBottom: 16 }}>
        <h2>브랜치 목록</h2>
        {!data && <p className="muted small">불러오는 중…</p>}
        {data && data.branches.length === 0 && <p className="muted small">브랜치가 없습니다.</p>}
        {data && data.branches.length > 0 && (
          <table className="posts-table">
            <thead>
              <tr>
                <th>이름</th>
                <th style={{ width: 160 }}>upstream</th>
                <th style={{ width: 100, textAlign: 'right' }}>ahead/behind</th>
                <th style={{ width: 160 }}>마지막 커밋</th>
                <th style={{ width: 240, textAlign: 'right' }}>작업</th>
              </tr>
            </thead>
            <tbody>
              {data.branches.map((b) => (
                <tr key={b.name} className={b.current ? 'is-active' : undefined}>
                  <td>
                    <strong>{b.current ? '★ ' : ''}{b.name}</strong>
                  </td>
                  <td className="muted small">{b.upstream ?? '-'}</td>
                  <td
                    style={{
                      textAlign: 'right',
                      fontVariantNumeric: 'tabular-nums'
                    }}
                  >
                    {b.ahead}/{b.behind}
                  </td>
                  <td className="muted small">{fmtDate(b.lastCommitDate)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="chip"
                      disabled={busy || b.current}
                      onClick={() => run(() => checkoutBranch(b.name))}
                    >
                      체크아웃
                    </button>
                    <button
                      type="button"
                      className="chip"
                      disabled={busy || b.current}
                      onClick={() => {
                        if (!window.confirm(`"${b.name}" 브랜치를 삭제할까요?`)) return
                        run(() => deleteBranch(b.name, false))
                      }}
                    >
                      삭제
                    </button>
                    <button
                      type="button"
                      className="chip"
                      disabled={busy || b.current}
                      onClick={() => {
                        if (!window.confirm(`"${b.name}"를 강제 삭제할까요? (병합 안 된 변경 손실 가능)`)) return
                        run(() => deleteBranch(b.name, true))
                      }}
                    >
                      강제 삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card">
        <h2>스태시</h2>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input
            className="input"
            type="text"
            placeholder="stash 메시지 (선택)"
            value={stashMsg}
            onChange={(e) => setStashMsg(e.target.value)}
            style={{ flex: 1 }}
          />
          <button
            type="button"
            className="btn"
            disabled={busy}
            onClick={() =>
              run(async () => {
                const r = await stashPush(stashMsg)
                setStashMsg('')
                return r
              })
            }
          >
            stash push
          </button>
        </div>

        {data?.stashes.length === 0 && <p className="muted small">스태시가 없습니다.</p>}
        {data && data.stashes.length > 0 && (
          <ul className="backlink-list">
            {data.stashes.map((s) => (
              <li key={s.index} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <code className="muted small">stash@{'{'}{s.index}{'}'}</code>
                <span style={{ flex: 1 }}>{s.subject}</span>
                <button
                  type="button"
                  className="chip"
                  disabled={busy}
                  onClick={() => run(() => stashPop(s.index))}
                >
                  pop
                </button>
                <button
                  type="button"
                  className="chip"
                  disabled={busy}
                  onClick={() => {
                    if (!window.confirm(`stash@{${s.index}}을 삭제할까요?`)) return
                    run(() => stashDrop(s.index))
                  }}
                >
                  drop
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
