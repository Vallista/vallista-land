import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { runLinkCheck } from '@/lib/api'
import type { LinkCheckItem, LinkCheckResult } from '@/lib/types'
import { CATEGORY_LABEL } from '@/lib/types'

type ReasonFilter = 'all' | 'missing-asset' | 'http-error' | 'network-error'

const REASON_LABEL: Record<LinkCheckItem['reason'], string> = {
  'missing-asset': '누락 이미지',
  'http-error': 'HTTP 오류',
  'network-error': '네트워크 오류'
}

export default function LinkChecker() {
  const [data, setData] = useState<LinkCheckResult | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [withExternal, setWithExternal] = useState(false)
  const [filter, setFilter] = useState<ReasonFilter>('all')

  const run = useCallback(() => {
    setLoading(true)
    setErr(null)
    setData(null)
    runLinkCheck({ external: withExternal })
      .then(setData)
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false))
  }, [withExternal])

  const filtered = useMemo(() => {
    if (!data) return [] as LinkCheckItem[]
    if (filter === 'all') return data.items
    return data.items.filter((x) => x.reason === filter)
  }, [data, filter])

  const counts = useMemo(() => {
    const c = { 'missing-asset': 0, 'http-error': 0, 'network-error': 0 }
    if (!data) return c
    for (const x of data.items) c[x.reason] += 1
    return c
  }, [data])

  return (
    <div>
      <header className="page-head page-head--row">
        <div>
          <h1>링크 체커</h1>
          <p className="muted small">끊어진 로컬 이미지·외부 URL 검사</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label className="chip" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={withExternal}
              onChange={(e) => setWithExternal(e.target.checked)}
            />
            외부 URL 포함
          </label>
          <button type="button" className="btn" onClick={run} disabled={loading}>
            {loading ? '검사 중…' : '검사 실행'}
          </button>
        </div>
      </header>

      {err && <div className="err">오류: {err}</div>}
      {loading && <div className="muted">검사 중… (외부 URL 포함 시 수십 초 걸릴 수 있습니다)</div>}

      {data && (
        <>
          <div className="stats">
            <div className="stats__card">
              <div className="stats__label">스캔한 글</div>
              <div className="stats__value">{data.scannedPosts.toLocaleString()}</div>
            </div>
            <div className="stats__card">
              <div className="stats__label">검사한 링크</div>
              <div className="stats__value">{data.checkedLinks.toLocaleString()}</div>
            </div>
            <div className="stats__card">
              <div className="stats__label">문제 항목</div>
              <div className="stats__value">{data.items.length.toLocaleString()}</div>
            </div>
          </div>

          <section className="card" style={{ marginBottom: 16 }}>
            <div className="chip-group">
              <button
                type="button"
                className={filter === 'all' ? 'chip chip--active' : 'chip'}
                onClick={() => setFilter('all')}
              >
                전체 ({data.items.length})
              </button>
              <button
                type="button"
                className={filter === 'missing-asset' ? 'chip chip--active' : 'chip'}
                onClick={() => setFilter('missing-asset')}
              >
                누락 이미지 ({counts['missing-asset']})
              </button>
              <button
                type="button"
                className={filter === 'http-error' ? 'chip chip--active' : 'chip'}
                onClick={() => setFilter('http-error')}
              >
                HTTP 오류 ({counts['http-error']})
              </button>
              <button
                type="button"
                className={filter === 'network-error' ? 'chip chip--active' : 'chip'}
                onClick={() => setFilter('network-error')}
              >
                네트워크 오류 ({counts['network-error']})
              </button>
            </div>
          </section>

          <section className="card">
            <table className="posts-table">
              <thead>
                <tr>
                  <th style={{ width: 110 }}>유형</th>
                  <th>내용</th>
                  <th style={{ width: 170 }}>글</th>
                  <th style={{ width: 120 }}>사유</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((x, i) => (
                  <tr key={`${x.category}/${x.slug}/${i}`}>
                    <td>
                      <span className="chip chip--warn">{x.type === 'image' ? '이미지' : '링크'}</span>
                    </td>
                    <td>
                      <code className="muted small" style={{ wordBreak: 'break-all' }}>
                        {x.raw}
                      </code>
                      {x.message && (
                        <div className="muted small" style={{ marginTop: 4 }}>
                          {x.status ? `${x.status} · ` : ''}
                          {x.message}
                        </div>
                      )}
                    </td>
                    <td>
                      <Link to={`/posts/${x.category}/${x.slug}/edit`}>
                        {CATEGORY_LABEL[x.category]} / {x.slug}
                      </Link>
                    </td>
                    <td>{REASON_LABEL[x.reason]}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="empty">
                      문제 없음
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        </>
      )}

      {!data && !loading && (
        <p className="muted">"검사 실행"을 눌러 시작합니다.</p>
      )}
    </div>
  )
}
