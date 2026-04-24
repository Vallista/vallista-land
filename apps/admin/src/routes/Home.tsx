import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteDraft, listDrafts, listPosts, ping } from '@/lib/api'
import {
  CATEGORIES,
  CATEGORY_LABEL,
  type DraftSummary,
  type PingResponse,
  type PostMeta
} from '@/lib/types'

const REL_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 60 * 60 * 24 * 365],
  ['month', 60 * 60 * 24 * 30],
  ['day', 60 * 60 * 24],
  ['hour', 60 * 60],
  ['minute', 60]
]

function formatRelative(iso: string): string {
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return iso
  const diffSec = Math.round((t - Date.now()) / 1000)
  const abs = Math.abs(diffSec)
  for (const [unit, sec] of REL_UNITS) {
    if (abs >= sec) {
      const rtf = new Intl.RelativeTimeFormat('ko', { numeric: 'auto' })
      return rtf.format(Math.round(diffSec / sec), unit)
    }
  }
  return '방금 전'
}

function formatDateShort(iso: string): string {
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return iso
  const d = new Date(t)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

type HeatCell = { ym: string; count: number; month: number; year: number }

type Analytics = {
  heatmap: HeatCell[]
  heatmapMax: number
  totalPublished: number
  lastPublishedAt: string | null
  daysSinceLast: number | null
  avgCadenceDays: number | null
  topTags: { value: string; count: number }[]
  topSeries: { value: string; count: number }[]
  recent: PostMeta[]
}

function buildAnalytics(all: PostMeta[]): Analytics {
  const published = all
    .filter((p) => p.status === 'published' && p.date)
    .sort((a, b) => Date.parse(b.date ?? '') - Date.parse(a.date ?? ''))

  const now = new Date()
  const heatmap: HeatCell[] = []
  for (let i = 23; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year = d.getFullYear()
    const month = d.getMonth() + 1
    heatmap.push({
      ym: `${year}-${String(month).padStart(2, '0')}`,
      year,
      month,
      count: 0
    })
  }
  const idxOf = new Map(heatmap.map((m, i) => [m.ym, i]))
  for (const p of published) {
    const d = new Date(p.date ?? '')
    if (Number.isNaN(d.getTime())) continue
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const idx = idxOf.get(ym)
    if (idx !== undefined) heatmap[idx].count += 1
  }
  const heatmapMax = heatmap.reduce((m, c) => Math.max(m, c.count), 0)

  const lastPublishedAt = published[0]?.date ?? null
  const daysSinceLast =
    lastPublishedAt !== null
      ? Math.max(0, Math.floor((Date.now() - Date.parse(lastPublishedAt)) / 86400000))
      : null

  let avgCadenceDays: number | null = null
  if (published.length >= 2) {
    let sum = 0
    let count = 0
    for (let i = 0; i < published.length - 1; i++) {
      const a = Date.parse(published[i].date ?? '')
      const b = Date.parse(published[i + 1].date ?? '')
      if (Number.isNaN(a) || Number.isNaN(b)) continue
      sum += Math.abs(a - b) / 86400000
      count += 1
    }
    if (count > 0) avgCadenceDays = Math.round(sum / count)
  }

  const tagMap = new Map<string, number>()
  const seriesMap = new Map<string, number>()
  for (const p of published) {
    for (const t of p.tags) {
      if (!t) continue
      tagMap.set(t, (tagMap.get(t) ?? 0) + 1)
    }
    if (p.series) seriesMap.set(p.series, (seriesMap.get(p.series) ?? 0) + 1)
  }
  const top = (m: Map<string, number>, n: number) =>
    [...m.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
      .slice(0, n)

  return {
    heatmap,
    heatmapMax,
    totalPublished: published.length,
    lastPublishedAt,
    daysSinceLast,
    avgCadenceDays,
    topTags: top(tagMap, 5),
    topSeries: top(seriesMap, 5),
    recent: published.slice(0, 5)
  }
}

function heatLevel(count: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0 || max <= 0) return 0
  const r = count / max
  if (r > 0.75) return 4
  if (r > 0.5) return 3
  if (r > 0.25) return 2
  return 1
}

export default function Home() {
  const [data, setData] = useState<PingResponse | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<DraftSummary[] | null>(null)
  const [posts, setPosts] = useState<PostMeta[] | null>(null)

  const refreshDrafts = useCallback(() => {
    listDrafts()
      .then((d) => setDrafts(d.items))
      .catch(() => setDrafts([]))
  }, [])

  useEffect(() => {
    ping()
      .then(setData)
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : String(e)))
    refreshDrafts()
    Promise.all(CATEGORIES.map((c) => listPosts(c)))
      .then((lists) => setPosts(lists.flat()))
      .catch(() => setPosts([]))
  }, [refreshDrafts])

  const analytics = useMemo(
    () => (posts ? buildAnalytics(posts) : null),
    [posts]
  )

  const onDiscard = async (id: string) => {
    if (!confirm('이 임시 글을 삭제할까요?')) return
    await deleteDraft(id)
    refreshDrafts()
  }

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

      <section className="card insight" style={{ marginBottom: 20 }}>
        <h2>작성 리듬</h2>
        <div className="rhythm">
          <div className="rhythm__cell">
            <div className="rhythm__label">총 발행</div>
            <div className="rhythm__value">
              {analytics ? analytics.totalPublished : '—'}
              <span className="rhythm__unit">편</span>
            </div>
          </div>
          <div className="rhythm__cell">
            <div className="rhythm__label">마지막 글</div>
            <div className="rhythm__value">
              {analytics?.daysSinceLast !== null && analytics?.daysSinceLast !== undefined
                ? analytics.daysSinceLast
                : '—'}
              <span className="rhythm__unit">일 전</span>
            </div>
            {analytics?.lastPublishedAt && (
              <div className="rhythm__sub">
                {formatDateShort(analytics.lastPublishedAt)}
              </div>
            )}
          </div>
          <div className="rhythm__cell">
            <div className="rhythm__label">평균 발행 주기</div>
            <div className="rhythm__value">
              {analytics?.avgCadenceDays ?? '—'}
              <span className="rhythm__unit">일</span>
            </div>
            <div className="rhythm__sub muted small">
              연속 글 사이 간격 평균
            </div>
          </div>
        </div>
      </section>

      <section className="card insight" style={{ marginBottom: 20 }}>
        <div className="insight__head">
          <h2>월별 발행 · 최근 24개월</h2>
          {analytics && analytics.heatmapMax > 0 && (
            <div className="heatmap__legend">
              <span className="muted small">적음</span>
              <span className="heatmap__swatch heatmap__swatch--1" />
              <span className="heatmap__swatch heatmap__swatch--2" />
              <span className="heatmap__swatch heatmap__swatch--3" />
              <span className="heatmap__swatch heatmap__swatch--4" />
              <span className="muted small">많음</span>
            </div>
          )}
        </div>
        {analytics === null ? (
          <div className="muted small">집계 중…</div>
        ) : analytics.totalPublished === 0 ? (
          <div className="empty">발행된 글이 없습니다.</div>
        ) : (
          <div className="heatmap">
            {analytics.heatmap.map((c) => {
              const lvl = heatLevel(c.count, analytics.heatmapMax)
              const isJan = c.month === 1
              return (
                <div
                  key={c.ym}
                  className={`heatmap__cell heatmap__cell--${lvl}`}
                  title={`${c.ym} · ${c.count}편`}
                  data-label={isJan ? String(c.year) : ''}
                >
                  <span className="heatmap__m">{c.month}</span>
                  {c.count > 0 && <span className="heatmap__n">{c.count}</span>}
                </div>
              )
            })}
          </div>
        )}
      </section>

      <div className="insight-grid" style={{ marginBottom: 20 }}>
        <section className="card insight">
          <h2>자주 쓴 태그</h2>
          {analytics === null ? (
            <div className="muted small">집계 중…</div>
          ) : analytics.topTags.length === 0 ? (
            <div className="empty">태그가 없습니다.</div>
          ) : (
            <ul className="taxo-list">
              {analytics.topTags.map((t) => {
                const pct =
                  analytics.topTags[0].count > 0
                    ? (t.count / analytics.topTags[0].count) * 100
                    : 0
                return (
                  <li key={t.value} className="taxo-list__item">
                    <span className="taxo-list__label">{t.value}</span>
                    <span className="taxo-list__bar">
                      <span
                        className="taxo-list__fill"
                        style={{ width: `${pct}%` }}
                      />
                    </span>
                    <span className="taxo-list__count">{t.count}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="card insight">
          <h2>시리즈</h2>
          {analytics === null ? (
            <div className="muted small">집계 중…</div>
          ) : analytics.topSeries.length === 0 ? (
            <div className="empty">시리즈가 없습니다.</div>
          ) : (
            <ul className="taxo-list">
              {analytics.topSeries.map((s) => {
                const pct =
                  analytics.topSeries[0].count > 0
                    ? (s.count / analytics.topSeries[0].count) * 100
                    : 0
                return (
                  <li key={s.value} className="taxo-list__item">
                    <span className="taxo-list__label">{s.value}</span>
                    <span className="taxo-list__bar">
                      <span
                        className="taxo-list__fill taxo-list__fill--alt"
                        style={{ width: `${pct}%` }}
                      />
                    </span>
                    <span className="taxo-list__count">{s.count}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>

      <section className="card insight" style={{ marginBottom: 20 }}>
        <h2>최근 발행</h2>
        {analytics === null ? (
          <div className="muted small">집계 중…</div>
        ) : analytics.recent.length === 0 ? (
          <div className="empty">발행된 글이 없습니다.</div>
        ) : (
          <ul className="recent-list">
            {analytics.recent.map((p) => (
              <li key={`${p.category}/${p.slug}`} className="recent-list__item">
                <Link
                  to={`/posts/${p.category}/${encodeURIComponent(p.slug)}`}
                  className="recent-list__main"
                >
                  <div className="recent-list__title">{p.title || p.slug}</div>
                  <div className="recent-list__meta">
                    <span className="recent-list__cat">
                      {CATEGORY_LABEL[p.category]}
                    </span>
                    {p.series && (
                      <span className="recent-list__series">{p.series}</span>
                    )}
                    {p.tags.slice(0, 3).map((t) => (
                      <span key={t} className="recent-list__tag">
                        #{t}
                      </span>
                    ))}
                  </div>
                </Link>
                <span className="recent-list__date">
                  {p.date ? formatDateShort(p.date) : '—'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card" style={{ marginBottom: 20 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 14
          }}
        >
          <h2 style={{ margin: 0 }}>작성 중인 글</h2>
          {drafts && drafts.length > 0 && (
            <span className="muted small">{drafts.length}개</span>
          )}
        </div>
        {drafts === null ? (
          <div className="muted small">불러오는 중…</div>
        ) : drafts.length === 0 ? (
          <div className="empty">임시저장된 글이 없습니다.</div>
        ) : (
          <ul className="drafts-list">
            {drafts.map((d) => {
              const cat = d.category ?? 'articles'
              const href = `/posts/${cat}/new?draft=${encodeURIComponent(d.draftId)}`
              return (
                <li key={d.draftId} className="drafts-list__item">
                  <Link to={href} className="drafts-list__main">
                    <div className="drafts-list__title">
                      {d.title.trim() || '(제목 없음)'}
                    </div>
                    <div className="drafts-list__meta">
                      <span className="drafts-list__cat">
                        {d.category ? CATEGORY_LABEL[d.category] : '카테고리 미정'}
                      </span>
                      {d.slug && <span className="drafts-list__slug">{d.slug}</span>}
                      <span className="drafts-list__time">
                        {formatRelative(d.updatedAt)}
                      </span>
                    </div>
                  </Link>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => onDiscard(d.draftId)}
                  >
                    삭제
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

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
