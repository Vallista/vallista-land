import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getPost } from '@/lib/api'
import { CATEGORIES, CATEGORY_LABEL, type Category, type PostFull } from '@/lib/types'

function isCategory(v: string | undefined): v is Category {
  return typeof v === 'string' && (CATEGORIES as readonly string[]).includes(v)
}

export default function PostDetail() {
  const { category, slug } = useParams<{ category: string; slug: string }>()
  const [post, setPost] = useState<PostFull | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!isCategory(category) || !slug) return
    setPost(null)
    setErr(null)
    getPost(category, slug)
      .then(setPost)
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : String(e)))
  }, [category, slug])

  if (!isCategory(category) || !slug) {
    return <div className="err">잘못된 경로입니다.</div>
  }

  if (err) return <div className="err">오류: {err}</div>
  if (!post) return <div className="muted">불러오는 중…</div>

  return (
    <div>
      <Link to={`/posts/${category}`} className="back">← {CATEGORY_LABEL[category]} 목록</Link>
      <header className="page-head page-head--row">
        <div>
          <h1>{post.title}</h1>
          <div className="muted small meta-line">
          <span>{post.date ? post.date.slice(0, 10) : '날짜 없음'}</span>
          <span>·</span>
          <span className={`status status--${post.status}`}>{post.status}</span>
          {post.series && (
            <>
              <span>·</span>
              <span>시리즈: {post.series}</span>
            </>
          )}
          {post.tags.length > 0 && (
            <>
              <span>·</span>
              <span>{post.tags.map((t) => `#${t}`).join(' ')}</span>
            </>
          )}
          </div>
        </div>
        <Link to={`/posts/${category}/${encodeURIComponent(slug)}/edit`} className="btn">
          편집
        </Link>
      </header>

      {post.description && <p className="dek">{post.description}</p>}

      <section className="source">
        <div className="source__head">
          <span>마크다운 소스</span>
          <span className="muted small"><code>{post.filePath}</code></span>
        </div>
        <pre><code>{post.content}</code></pre>
      </section>
    </div>
  )
}
