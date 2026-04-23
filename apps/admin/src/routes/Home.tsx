import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ping } from '@/lib/api'
import { CATEGORIES, CATEGORY_LABEL, type PingResponse } from '@/lib/types'

export default function Home() {
  const [data, setData] = useState<PingResponse | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    ping()
      .then(setData)
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : String(e)))
  }, [])

  return (
    <div>
      <header className="page-head">
        <h1>대시보드</h1>
        <p className="muted">로컬에서 블로그 콘텐츠를 관리합니다.</p>
      </header>
      {err && <div className="err">서버 연결 오류: {err}</div>}
      <div className="stats">
        {CATEGORIES.map((cat) => (
          <Link key={cat} to={`/posts/${cat}`} className="stats__card">
            <div className="stats__label">{CATEGORY_LABEL[cat]}</div>
            <div className="stats__value">{data ? data.counts[cat] : '—'}</div>
          </Link>
        ))}
      </div>
      {data && (
        <section className="card">
          <h2>서버 정보</h2>
          <dl>
            <dt>contents root</dt>
            <dd><code>{data.contentsRoot}</code></dd>
          </dl>
        </section>
      )}
    </div>
  )
}
