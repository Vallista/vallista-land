import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getStats } from '@/lib/api'
import type { StatsReport } from '@/lib/types'
import { CATEGORY_LABEL } from '@/lib/types'

export default function Stats() {
  const [data, setData] = useState<StatsReport | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    setErr(null)
    getStats()
      .then(setData)
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false))
  }, [])

  const maxMonthly = useMemo(() => {
    if (!data) return 1
    return Math.max(1, ...data.monthly.map((m) => m.count))
  }, [data])

  const maxTag = useMemo(() => {
    if (!data) return 1
    return Math.max(1, ...data.tags.map((t) => t.count))
  }, [data])

  return (
    <div>
      <header className="page-head">
        <h1>콘텐츠 통계</h1>
        <p className="muted small">글 수·단어 수·카테고리·월별·태그 랭킹</p>
      </header>

      {err && <div className="err">오류: {err}</div>}
      {loading && !data && <div className="muted">불러오는 중…</div>}

      {data && (
        <>
          <div className="stats">
            <div className="stats__card">
              <div className="stats__label">총 글 수</div>
              <div className="stats__value">{data.totalPosts.toLocaleString()}</div>
            </div>
            <div className="stats__card">
              <div className="stats__label">총 단어 수</div>
              <div className="stats__value">{data.totalWords.toLocaleString()}</div>
            </div>
            <div className="stats__card">
              <div className="stats__label">평균 단어 수</div>
              <div className="stats__value">{data.avgWords.toLocaleString()}</div>
            </div>
          </div>

          <section className="card" style={{ marginBottom: 20 }}>
            <h2>카테고리별</h2>
            <table className="posts-table">
              <thead>
                <tr>
                  <th>카테고리</th>
                  <th style={{ textAlign: 'right', width: 100 }}>글 수</th>
                  <th style={{ textAlign: 'right', width: 130 }}>총 단어</th>
                  <th style={{ textAlign: 'right', width: 130 }}>평균</th>
                </tr>
              </thead>
              <tbody>
                {data.byCategory.map((c) => (
                  <tr key={c.category}>
                    <td>
                      <Link to={`/posts/${c.category}`}>{CATEGORY_LABEL[c.category]}</Link>
                    </td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {c.count.toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {c.words.toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {c.count === 0 ? '-' : Math.round(c.words / c.count).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="card" style={{ marginBottom: 20 }}>
            <h2>월별 글 수</h2>
            {data.monthly.length === 0 ? (
              <p className="muted small">날짜가 있는 글이 없습니다.</p>
            ) : (
              <>
                <div className="ga-bars">
                  {data.monthly.map((m) => (
                    <div key={m.month} className="ga-bar" title={`${m.month} · ${m.count}개`}>
                      <div
                        className="ga-bar__fill"
                        style={{ height: `${(m.count / maxMonthly) * 100}%` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="ga-bars__axis">
                  <span>{data.monthly[0]?.month}</span>
                  <span>{data.monthly[data.monthly.length - 1]?.month}</span>
                </div>
              </>
            )}
          </section>

          <div className="ga-grid">
            <section className="card">
              <h2>인기 태그</h2>
              {data.tags.length === 0 ? (
                <p className="muted small">태그가 없습니다.</p>
              ) : (
                <ul className="stats-taglist">
                  {data.tags.map((t) => (
                    <li key={t.tag} className="stats-taglist__row">
                      <span className="stats-taglist__label">{t.tag}</span>
                      <span
                        className="stats-taglist__bar"
                        style={{ width: `${(t.count / maxTag) * 100}%` }}
                      />
                      <span className="stats-taglist__count">{t.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="card">
              <h2>최장 글 TOP 5</h2>
              <table className="posts-table">
                <thead>
                  <tr>
                    <th>글</th>
                    <th style={{ textAlign: 'right', width: 90 }}>단어</th>
                  </tr>
                </thead>
                <tbody>
                  {data.longest.map((p) => (
                    <tr key={`${p.category}/${p.slug}`}>
                      <td>
                        <Link to={`/posts/${p.category}/${p.slug}`}>{p.title}</Link>
                        <div className="muted small">{CATEGORY_LABEL[p.category]}</div>
                      </td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {p.words.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {data.longest.length === 0 && (
                    <tr>
                      <td colSpan={2} className="empty">
                        데이터 없음
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>
          </div>

          <section className="card" style={{ marginTop: 20 }}>
            <h2>최단 글 TOP 5</h2>
            <table className="posts-table">
              <thead>
                <tr>
                  <th>글</th>
                  <th style={{ textAlign: 'right', width: 90 }}>단어</th>
                </tr>
              </thead>
              <tbody>
                {data.shortest.map((p) => (
                  <tr key={`${p.category}/${p.slug}`}>
                    <td>
                      <Link to={`/posts/${p.category}/${p.slug}`}>{p.title}</Link>
                      <div className="muted small">{CATEGORY_LABEL[p.category]}</div>
                    </td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {p.words.toLocaleString()}
                    </td>
                  </tr>
                ))}
                {data.shortest.length === 0 && (
                  <tr>
                    <td colSpan={2} className="empty">
                      데이터 없음
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  )
}
