import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { listPosts } from '@/lib/api'
import { CATEGORIES, CATEGORY_LABEL, type Category, type PostMeta, type PostStatus } from '@/lib/types'

type StatusFilter = 'all' | PostStatus
const STATUS_FILTERS: StatusFilter[] = ['all', 'published', 'draft', 'trashed']
const STATUS_LABEL: Record<StatusFilter, string> = {
  all: '전체',
  published: '공개',
  draft: '초안',
  trashed: '휴지통'
}

type SortKey = 'title' | 'status' | 'date'
type SortDir = 'asc' | 'desc'

function isCategory(v: string | undefined): v is Category {
  return typeof v === 'string' && (CATEGORIES as readonly string[]).includes(v)
}

function dateToMs(v: string | null | undefined): number {
  if (!v) return 0
  const cleaned = String(v).replace(/^['"`]+|['"`]+$/g, '').trim()
  const t = Date.parse(cleaned)
  return Number.isNaN(t) ? 0 : t
}

const STATUS_ORDER: Record<PostStatus, number> = {
  published: 0,
  draft: 1,
  trashed: 2
}

function SortHeader({
  label,
  keyName,
  sortKey,
  sortDir,
  onClick
}: {
  label: string
  keyName: SortKey
  sortKey: SortKey
  sortDir: SortDir
  onClick: (k: SortKey) => void
}) {
  const active = sortKey === keyName
  const arrow = !active ? '↕' : sortDir === 'asc' ? '↑' : '↓'
  return (
    <th
      className={active ? 'th-sort th-sort--active' : 'th-sort'}
      onClick={() => onClick(keyName)}
    >
      <span>{label}</span>
      <span className="th-sort__arrow">{arrow}</span>
    </th>
  )
}

export default function PostsList() {
  const { category } = useParams<{ category: string }>()
  const [posts, setPosts] = useState<PostMeta[] | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(k)
      setSortDir(k === 'date' ? 'desc' : 'asc')
    }
  }

  useEffect(() => {
    if (!isCategory(category)) return
    setPosts(null)
    setErr(null)
    listPosts(category)
      .then(setPosts)
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : String(e)))
  }, [category])

  const filtered = useMemo(() => {
    if (!posts) return []
    const q = query.trim().toLowerCase()
    const base = posts
      .filter((p) => (statusFilter === 'all' ? true : p.status === statusFilter))
      .filter((p) => {
        if (!q) return true
        if (p.title.toLowerCase().includes(q)) return true
        return p.tags.some((t) => t.toLowerCase().includes(q))
      })
    const factor = sortDir === 'asc' ? 1 : -1
    return [...base].sort((a, b) => {
      if (sortKey === 'title') {
        return a.title.localeCompare(b.title, 'ko') * factor
      }
      if (sortKey === 'status') {
        return (STATUS_ORDER[a.status] - STATUS_ORDER[b.status]) * factor
      }
      return (dateToMs(a.date) - dateToMs(b.date)) * factor
    })
  }, [posts, statusFilter, query, sortKey, sortDir])

  if (!isCategory(category)) {
    return <div className="err">알 수 없는 카테고리입니다.</div>
  }

  return (
    <div>
      <header className="page-head page-head--row">
        <h1>
          {CATEGORY_LABEL[category]}
          {posts && (
            <span className="muted"> ({filtered.length}/{posts.length})</span>
          )}
        </h1>
        <Link to={`/posts/${category}/new`} className="btn">새 글</Link>
      </header>

      <div className="toolbar">
        <input
          type="search"
          placeholder="제목·태그 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="chip-group">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              className={s === statusFilter ? 'chip chip--active' : 'chip'}
              onClick={() => setStatusFilter(s)}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      {err && <div className="err">오류: {err}</div>}
      {!posts && !err && <div className="muted">불러오는 중…</div>}

      {posts && (
        <table className="posts-table posts-table--sortable">
          <thead>
            <tr>
              <SortHeader label="제목" keyName="title" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
              <th>태그</th>
              <SortHeader label="상태" keyName="status" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
              <SortHeader label="작성일" keyName="date" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={`${p.category}/${p.slug}`}>
                <td>
                  <Link to={`/posts/${p.category}/${encodeURIComponent(p.slug)}`}>{p.title}</Link>
                  {p.series && <span className="series">· {p.series}</span>}
                </td>
                <td>
                  {p.tags.map((t) => (
                    <span key={t} className="tag">{t}</span>
                  ))}
                </td>
                <td><span className={`status status--${p.status}`}>{p.status}</span></td>
                <td className="muted small">{p.date ? p.date.slice(0, 10) : '—'}</td>
                <td className="row-actions">
                  <Link to={`/posts/${p.category}/${encodeURIComponent(p.slug)}/edit`} className="row-action">
                    편집
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="empty">
                  {posts.length === 0 ? '이 카테고리에 글이 없습니다.' : '조건에 맞는 글이 없습니다.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}
