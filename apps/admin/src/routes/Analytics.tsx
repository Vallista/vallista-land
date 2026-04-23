import { useEffect, useMemo, useState } from 'react'
import { getAnalyticsOverview } from '@/lib/api'
import type { AnalyticsResult } from '@/lib/types'

const RANGES: Array<{ label: string; days: number }> = [
  { label: '7일', days: 7 },
  { label: '30일', days: 30 },
  { label: '90일', days: 90 }
]

function fmtDate(yyyymmdd: string): string {
  if (yyyymmdd.length !== 8) return yyyymmdd
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`
}

export default function Analytics() {
  const [days, setDays] = useState<number>(30)
  const [data, setData] = useState<AnalyticsResult | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    setErr(null)
    setData(null)
    getAnalyticsOverview(days)
      .then(setData)
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false))
  }, [days])

  const maxDaily = useMemo(() => {
    if (!data || !data.configured) return 1
    return Math.max(1, ...data.byDay.map((r) => r.pageViews))
  }, [data])

  return (
    <div>
      <header className="page-head page-head--row">
        <div>
          <h1>애널리틱스</h1>
          <p className="muted small">블로그 조회수, 세션, 인기 페이지 (GA4)</p>
        </div>
        <div className="chip-group">
          {RANGES.map((r) => (
            <button
              key={r.days}
              type="button"
              className={r.days === days ? 'chip chip--active' : 'chip'}
              onClick={() => setDays(r.days)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </header>

      {err && <div className="err">오류: {err}</div>}
      {loading && <div className="muted">불러오는 중…</div>}

      {data && !data.configured && (
        <section className="card ga-setup">
          <h2>GA 연동 설정 필요</h2>
          <p className="muted">{data.hint}</p>
          <ol className="ga-steps">
            <li>
              Google Cloud Console에서 서비스 계정 생성 후{' '}
              <strong>JSON 키</strong>를 다운로드합니다.
            </li>
            <li>
              GA4 속성 → 관리 → <strong>속성 액세스 관리</strong>에서 해당 서비스 계정
              이메일을 <strong>뷰어</strong>로 추가합니다.
            </li>
            <li>
              <code>apps/admin/.env.local</code>에 다음을 추가:
              <pre className="diff-stat">{`GA_PROPERTY_ID=123456789
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/key.json`}</pre>
            </li>
            <li>dev 서버 재시작.</li>
          </ol>
        </section>
      )}

      {data && data.configured && (
        <>
          <div className="stats">
            <div className="stats__card">
              <div className="stats__label">조회수</div>
              <div className="stats__value">{data.totals.pageViews.toLocaleString()}</div>
            </div>
            <div className="stats__card">
              <div className="stats__label">세션</div>
              <div className="stats__value">{data.totals.sessions.toLocaleString()}</div>
            </div>
            <div className="stats__card">
              <div className="stats__label">방문자</div>
              <div className="stats__value">{data.totals.users.toLocaleString()}</div>
            </div>
          </div>

          <section className="card" style={{ marginBottom: 20 }}>
            <h2>일자별 조회수</h2>
            <div className="ga-bars">
              {data.byDay.map((r) => (
                <div key={r.date} className="ga-bar">
                  <div
                    className="ga-bar__fill"
                    style={{ height: `${(r.pageViews / maxDaily) * 100}%` }}
                    title={`${fmtDate(r.date)}: ${r.pageViews}`}
                  />
                </div>
              ))}
            </div>
            <div className="ga-bars__axis">
              <span>{fmtDate(data.byDay[0]?.date ?? '')}</span>
              <span>{fmtDate(data.byDay[data.byDay.length - 1]?.date ?? '')}</span>
            </div>
          </section>

          <div className="ga-grid">
            <section className="card">
              <h2>인기 페이지</h2>
              <table className="posts-table">
                <thead>
                  <tr>
                    <th>경로</th>
                    <th style={{ textAlign: 'right', width: 80 }}>조회수</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topPages.map((p) => (
                    <tr key={p.path}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{p.title || p.path}</div>
                        <code className="muted small">{p.path}</code>
                      </td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {p.pageViews.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {data.topPages.length === 0 && (
                    <tr>
                      <td colSpan={2} className="empty">데이터 없음</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>

            <section className="card">
              <h2>유입 경로</h2>
              <table className="posts-table">
                <thead>
                  <tr>
                    <th>소스</th>
                    <th style={{ textAlign: 'right', width: 80 }}>세션</th>
                  </tr>
                </thead>
                <tbody>
                  {data.referers.map((r) => (
                    <tr key={r.source}>
                      <td>{r.source || '(direct)'}</td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {r.sessions.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {data.referers.length === 0 && (
                    <tr>
                      <td colSpan={2} className="empty">데이터 없음</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>
          </div>
        </>
      )}
    </div>
  )
}
