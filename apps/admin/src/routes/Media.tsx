import { useCallback, useEffect, useMemo, useState } from 'react'
import { deleteAssets, getAssetReport } from '@/lib/api'
import type { AssetEntry, AssetReport, Category } from '@/lib/types'
import { CATEGORY_LABEL } from '@/lib/types'

type Filter = 'all' | 'orphan'

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

export default function Media() {
  const [data, setData] = useState<AssetReport | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')
  const [catFilter, setCatFilter] = useState<Category | 'all'>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    setErr(null)
    getAssetReport()
      .then((r) => {
        setData(r)
        setSelected(new Set())
      })
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(load, [load])

  const items = useMemo(() => {
    if (!data) return [] as AssetEntry[]
    return data.items.filter((x) => {
      if (filter === 'orphan' && x.referenced) return false
      if (catFilter !== 'all' && x.category !== catFilter) return false
      return true
    })
  }, [data, filter, catFilter])

  const selectedBytes = useMemo(() => {
    if (!data) return 0
    return data.items
      .filter((x) => selected.has(x.relPath))
      .reduce((a, x) => a + x.sizeBytes, 0)
  }, [data, selected])

  const toggleOne = (relPath: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(relPath)) next.delete(relPath)
      else next.add(relPath)
      return next
    })
  }

  const toggleAllVisible = () => {
    setSelected((prev) => {
      const visible = new Set(items.map((x) => x.relPath))
      const allSelected = items.every((x) => prev.has(x.relPath))
      if (allSelected) {
        const next = new Set(prev)
        for (const p of visible) next.delete(p)
        return next
      }
      const next = new Set(prev)
      for (const p of visible) next.add(p)
      return next
    })
  }

  const selectAllOrphans = () => {
    if (!data) return
    const orphans = data.items.filter((x) => !x.referenced).map((x) => x.relPath)
    setSelected(new Set(orphans))
  }

  const handleDelete = async () => {
    if (selected.size === 0) return
    const hasReferenced = data?.items.some(
      (x) => selected.has(x.relPath) && x.referenced
    )
    const warn = hasReferenced
      ? `선택한 ${selected.size}개 중 본문에서 참조되는 이미지가 있습니다. 정말 삭제하시겠습니까?`
      : `선택한 ${selected.size}개 이미지를 삭제하시겠습니까?`
    if (!window.confirm(warn)) return
    setBusy(true)
    setErr(null)
    try {
      const result = await deleteAssets(Array.from(selected))
      if (result.errors.length > 0) {
        setErr(`${result.errors.length}개 삭제 실패: ${result.errors[0].error}`)
      }
      load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const allVisibleSelected =
    items.length > 0 && items.every((x) => selected.has(x.relPath))

  return (
    <div>
      <header className="page-head page-head--row">
        <div>
          <h1>미디어</h1>
          <p className="muted small">글 폴더의 이미지 에셋 관리·고아 파일 정리</p>
        </div>
        <div className="chip-group">
          <button
            type="button"
            className={filter === 'all' ? 'chip chip--active' : 'chip'}
            onClick={() => setFilter('all')}
          >
            전체
          </button>
          <button
            type="button"
            className={filter === 'orphan' ? 'chip chip--active' : 'chip'}
            onClick={() => setFilter('orphan')}
          >
            고아 파일만
          </button>
        </div>
      </header>

      {err && <div className="err">오류: {err}</div>}
      {loading && !data && <div className="muted">불러오는 중…</div>}

      {data && (
        <>
          <div className="stats">
            <div className="stats__card">
              <div className="stats__label">총 용량</div>
              <div className="stats__value">{fmtBytes(data.totalBytes)}</div>
            </div>
            <div className="stats__card">
              <div className="stats__label">고아 파일</div>
              <div className="stats__value">{fmtBytes(data.orphanBytes)}</div>
            </div>
            <div className="stats__card">
              <div className="stats__label">총 파일 수</div>
              <div className="stats__value">{data.items.length.toLocaleString()}</div>
            </div>
          </div>

          <section className="card" style={{ marginBottom: 16 }}>
            <div className="chip-group" style={{ marginBottom: 8 }}>
              <button
                type="button"
                className={catFilter === 'all' ? 'chip chip--active' : 'chip'}
                onClick={() => setCatFilter('all')}
              >
                전체 카테고리
              </button>
              {data.byCategory.map((c) => (
                <button
                  key={c.category}
                  type="button"
                  className={catFilter === c.category ? 'chip chip--active' : 'chip'}
                  onClick={() => setCatFilter(c.category)}
                >
                  {CATEGORY_LABEL[c.category]} · {c.count}
                  {c.orphans > 0 ? ` (고아 ${c.orphans})` : ''}
                </button>
              ))}
            </div>

            <div
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                flexWrap: 'wrap'
              }}
            >
              <button type="button" className="chip" onClick={toggleAllVisible}>
                {allVisibleSelected ? '표시된 항목 선택 해제' : '표시된 항목 모두 선택'}
              </button>
              <button type="button" className="chip" onClick={selectAllOrphans}>
                고아 파일 모두 선택
              </button>
              <button
                type="button"
                className="chip"
                onClick={() => setSelected(new Set())}
                disabled={selected.size === 0}
              >
                선택 해제
              </button>
              <span className="muted small" style={{ marginLeft: 'auto' }}>
                {selected.size}개 선택 · {fmtBytes(selectedBytes)}
              </span>
              <button
                type="button"
                className="btn btn--danger"
                disabled={selected.size === 0 || busy}
                onClick={handleDelete}
              >
                {busy ? '삭제 중…' : '선택 삭제'}
              </button>
            </div>
          </section>

          <section className="card">
            <table className="posts-table">
              <thead>
                <tr>
                  <th style={{ width: 32 }}>
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleAllVisible}
                      aria-label="모두 선택"
                    />
                  </th>
                  <th>파일</th>
                  <th style={{ width: 110 }}>카테고리</th>
                  <th style={{ width: 110 }}>참조</th>
                  <th style={{ width: 100, textAlign: 'right' }}>크기</th>
                </tr>
              </thead>
              <tbody>
                {items.map((x) => (
                  <tr key={x.relPath}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.has(x.relPath)}
                        onChange={() => toggleOne(x.relPath)}
                        aria-label={`${x.filename} 선택`}
                      />
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{x.filename}</div>
                      <code className="muted small">{x.relPath}</code>
                    </td>
                    <td>
                      <span className="muted small">
                        {CATEGORY_LABEL[x.category]} / {x.postSlug}
                      </span>
                    </td>
                    <td>
                      {x.referenced ? (
                        <span className="chip chip--ok">참조됨</span>
                      ) : (
                        <span className="chip chip--warn">고아</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {fmtBytes(x.sizeBytes)}
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="empty">
                      표시할 파일이 없습니다.
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
