import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { deleteDraft, listDrafts } from '@/lib/api'
import { CATEGORY_LABEL, type DraftSummary } from '@/lib/types'

function bytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

function timeAgo(iso: string): string {
  const ms = Date.now() - Date.parse(iso)
  if (!Number.isFinite(ms)) return iso
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}초 전`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  const d = Math.floor(h / 24)
  return `${d}일 전`
}

const STALE_MS = 1000 * 60 * 60 * 24 * 7

export default function Drafts() {
  const navigate = useNavigate()
  const [items, setItems] = useState<DraftSummary[] | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)

  const load = () => {
    setErr(null)
    setItems(null)
    setSelected(new Set())
    listDrafts()
      .then((r) => setItems(r.items))
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : String(e)))
  }

  useEffect(load, [])

  const stale = useMemo(() => {
    if (!items) return []
    const now = Date.now()
    return items.filter((x) => now - Date.parse(x.updatedAt) > STALE_MS)
  }, [items])

  const totalBytes = useMemo(
    () => (items ? items.reduce((a, x) => a + x.sizeBytes, 0) : 0),
    [items]
  )

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (!items) return
    if (selected.size === items.length) setSelected(new Set())
    else setSelected(new Set(items.map((x) => x.draftId)))
  }

  const selectStale = () => {
    if (!items) return
    setSelected(new Set(stale.map((x) => x.draftId)))
  }

  const removeSelected = async () => {
    if (selected.size === 0 || !items) return
    const msg = `임시저장 ${selected.size}개를 삭제합니다. 복구할 수 없습니다. 계속할까요?`
    if (!window.confirm(msg)) return
    setBusy(true)
    try {
      for (const id of selected) {
        await deleteDraft(id)
      }
      load()
    } finally {
      setBusy(false)
    }
  }

  const openDraft = (item: DraftSummary) => {
    const cat = item.category ?? 'articles'
    navigate(`/posts/${cat}/new?draft=${encodeURIComponent(item.draftId)}`)
  }

  return (
    <div>
      <header className="page-head page-head--row">
        <div>
          <h1>임시저장</h1>
          <div className="muted small meta-line">
            {items ? (
              <>
                <span>{items.length}개</span>
                <span>·</span>
                <span>총 {bytes(totalBytes)}</span>
                {stale.length > 0 && (
                  <>
                    <span>·</span>
                    <span className="warn">7일 초과 {stale.length}개</span>
                  </>
                )}
              </>
            ) : (
              <span>불러오는 중…</span>
            )}
          </div>
        </div>
        <div className="edit-actions">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={load}
            disabled={busy}
          >
            새로고침
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={selectStale}
            disabled={busy || stale.length === 0}
          >
            7일 초과 선택
          </button>
          <button
            type="button"
            className="btn btn--danger"
            onClick={() => void removeSelected()}
            disabled={busy || selected.size === 0}
          >
            선택 삭제 ({selected.size})
          </button>
        </div>
      </header>

      {err && <div className="err">오류: {err}</div>}

      {items && items.length === 0 && (
        <p className="muted">임시저장이 없습니다.</p>
      )}

      {items && items.length > 0 && (
        <table className="posts-table">
          <thead>
            <tr>
              <th style={{ width: 32 }}>
                <input
                  type="checkbox"
                  checked={selected.size === items.length && items.length > 0}
                  onChange={toggleAll}
                  aria-label="전체 선택"
                />
              </th>
              <th>제목</th>
              <th>카테고리</th>
              <th>수정</th>
              <th>크기</th>
              <th>에셋</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const isStale = Date.now() - Date.parse(item.updatedAt) > STALE_MS
              return (
                <tr key={item.draftId}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.has(item.draftId)}
                      onChange={() => toggle(item.draftId)}
                      aria-label={item.draftId}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => openDraft(item)}
                    >
                      {item.title.trim() || '(제목 없음)'}
                    </button>
                    {item.slug && <div className="muted small"><code>{item.slug}</code></div>}
                  </td>
                  <td>
                    {item.category ? CATEGORY_LABEL[item.category] : <span className="muted">미정</span>}
                  </td>
                  <td className="muted small">
                    {timeAgo(item.updatedAt)}
                    {isStale && <span className="warn" style={{ marginLeft: 6 }}>STALE</span>}
                  </td>
                  <td className="small">{bytes(item.sizeBytes)}</td>
                  <td className="small">{item.assetCount}</td>
                  <td className="row-actions">
                    <button
                      type="button"
                      className="row-action row-action--danger"
                      disabled={busy}
                      onClick={async () => {
                        if (!window.confirm(`${item.title || item.draftId} 을(를) 삭제할까요?`)) return
                        setBusy(true)
                        try {
                          await deleteDraft(item.draftId)
                          load()
                        } finally {
                          setBusy(false)
                        }
                      }}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      <p className="muted small" style={{ marginTop: 12 }}>
        힌트: 7일 경과 임시저장은 서버가 자동 정리합니다. 여기서 즉시 삭제할 수도 있습니다.
        <Link to="/" style={{ marginLeft: 8 }}>대시보드로</Link>
      </p>
    </div>
  )
}
