import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSeries } from '@/lib/api'
import type { SeriesReport } from '@/lib/types'
import { CATEGORY_LABEL } from '@/lib/types'

export default function Series() {
  const [data, setData] = useState<SeriesReport | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    setErr(null)
    getSeries()
      .then(setData)
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <header className="page-head">
        <h1>시리즈</h1>
        <p className="muted small">
          frontmatter <code>series</code> 값이 있는 글을 묶어 순서대로 표시합니다.
        </p>
      </header>

      {err && <div className="err">오류: {err}</div>}
      {loading && !data && <div className="muted">불러오는 중…</div>}

      {data && data.items.length === 0 && (
        <p className="muted">시리즈가 없습니다. frontmatter에 <code>series: "이름"</code> 또는 <code>series: {'{ name, order }'}</code>를 추가하세요.</p>
      )}

      {data &&
        data.items.map((s) => (
          <section key={`${s.category}::${s.name}`} className="card" style={{ marginBottom: 16 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 8
              }}
            >
              <h2 style={{ margin: 0 }}>{s.name}</h2>
              <span className="muted small">
                {CATEGORY_LABEL[s.category]} · {s.posts.length}편
              </span>
            </div>
            <ol className="series-list">
              {s.posts.map((p, i) => (
                <li key={`${s.category}/${p.slug}`} className="series-list__row">
                  <span className="series-list__order">
                    {p.order !== null ? p.order : i + 1}
                  </span>
                  <Link to={`/posts/${s.category}/${p.slug}`} className="series-list__title">
                    {p.title}
                  </Link>
                  <span className="series-list__date muted small">
                    {p.date ? p.date.slice(0, 10) : '-'}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        ))}
    </div>
  )
}
