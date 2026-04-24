import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getBacklinks } from '@/lib/api'
import type { BacklinkReport } from '@/lib/types'
import { CATEGORY_LABEL } from '@/lib/types'

export default function Backlinks() {
  const [data, setData] = useState<BacklinkReport | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [focus, setFocus] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setErr(null)
    getBacklinks()
      .then(setData)
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false))
  }, [])

  const focused = useMemo(() => {
    if (!data || !focus) return null
    const [category, slug] = focus.split('/')
    const post = data.byPost.find((p) => p.category === category && p.slug === slug)
    if (!post) return null
    const incoming = data.edges.filter(
      (e) => e.to.category === category && e.to.slug === slug
    )
    const outgoing = data.edges.filter(
      (e) => e.from.category === category && e.from.slug === slug
    )
    return { post, incoming, outgoing }
  }, [data, focus])

  return (
    <div>
      <header className="page-head">
        <h1>백링크</h1>
        <p className="muted small">
          본문에서 <code>/articles/slug</code> 형태로 연결된 내부 링크를 수집합니다.
        </p>
      </header>

      {err && <div className="err">오류: {err}</div>}
      {loading && !data && <div className="muted">불러오는 중…</div>}

      {data && (
        <>
          <div className="stats">
            <div className="stats__card">
              <div className="stats__label">총 링크 수</div>
              <div className="stats__value">{data.edges.length.toLocaleString()}</div>
            </div>
            <div className="stats__card">
              <div className="stats__label">연결된 글</div>
              <div className="stats__value">{data.byPost.length.toLocaleString()}</div>
            </div>
          </div>

          <div className="ga-grid">
            <section className="card">
              <h2>글별 백링크</h2>
              {data.byPost.length === 0 ? (
                <p className="muted small">내부 백링크가 없습니다.</p>
              ) : (
                <table className="posts-table">
                  <thead>
                    <tr>
                      <th>글</th>
                      <th style={{ textAlign: 'right', width: 80 }}>들어옴</th>
                      <th style={{ textAlign: 'right', width: 80 }}>나감</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byPost.map((p) => {
                      const key = `${p.category}/${p.slug}`
                      return (
                        <tr
                          key={key}
                          className={focus === key ? 'is-active' : undefined}
                          onClick={() => setFocus(focus === key ? null : key)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td>
                            <div style={{ fontWeight: 500 }}>{p.title}</div>
                            <div className="muted small">
                              {CATEGORY_LABEL[p.category]} / {p.slug}
                            </div>
                          </td>
                          <td
                            style={{
                              textAlign: 'right',
                              fontVariantNumeric: 'tabular-nums',
                              fontWeight: p.incoming > 0 ? 500 : 400
                            }}
                          >
                            {p.incoming}
                          </td>
                          <td
                            style={{
                              textAlign: 'right',
                              fontVariantNumeric: 'tabular-nums',
                              color: 'var(--ink-soft)'
                            }}
                          >
                            {p.outgoing}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </section>

            <section className="card">
              <h2>{focused ? focused.post.title : '글 선택'}</h2>
              {!focused && (
                <p className="muted small">
                  왼쪽 표의 글을 클릭하면 양방향 연결 관계를 확인할 수 있습니다.
                </p>
              )}
              {focused && (
                <>
                  <Link
                    to={`/posts/${focused.post.category}/${focused.post.slug}`}
                    className="muted small"
                  >
                    {CATEGORY_LABEL[focused.post.category]} / {focused.post.slug}
                  </Link>

                  <h3 style={{ marginTop: 16, marginBottom: 6, fontSize: 14 }}>
                    이 글로 들어오는 링크 ({focused.incoming.length})
                  </h3>
                  {focused.incoming.length === 0 ? (
                    <p className="muted small">없음</p>
                  ) : (
                    <ul className="backlink-list">
                      {focused.incoming.map((e, i) => (
                        <li key={`in-${i}`}>
                          <Link to={`/posts/${e.from.category}/${e.from.slug}`}>
                            {e.from.title}
                          </Link>
                          <span className="muted small"> · {CATEGORY_LABEL[e.from.category]}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <h3 style={{ marginTop: 16, marginBottom: 6, fontSize: 14 }}>
                    이 글이 거는 링크 ({focused.outgoing.length})
                  </h3>
                  {focused.outgoing.length === 0 ? (
                    <p className="muted small">없음</p>
                  ) : (
                    <ul className="backlink-list">
                      {focused.outgoing.map((e, i) => (
                        <li key={`out-${i}`}>
                          <Link to={`/posts/${e.to.category}/${e.to.slug}`}>{e.to.title}</Link>
                          <span className="muted small"> · {CATEGORY_LABEL[e.to.category]}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  )
}
