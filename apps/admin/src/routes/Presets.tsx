import { useCallback, useEffect, useMemo, useState } from 'react'
import { deletePreset, listPresets, savePreset } from '@/lib/api'
import type { Category, Preset } from '@/lib/types'
import { CATEGORIES, CATEGORY_LABEL } from '@/lib/types'

type FormState = {
  id: string | null
  name: string
  category: Category
  frontmatterJson: string
  body: string
}

const EMPTY_FRONTMATTER = `{
  "title": "",
  "date": "",
  "tags": [],
  "description": ""
}
`

const DEFAULT_STATE: FormState = {
  id: null,
  name: '',
  category: 'articles',
  frontmatterJson: EMPTY_FRONTMATTER,
  body: ''
}

export default function Presets() {
  const [items, setItems] = useState<Preset[] | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(DEFAULT_STATE)
  const [saving, setSaving] = useState(false)
  const [formErr, setFormErr] = useState<string | null>(null)

  const load = useCallback(() => {
    setErr(null)
    listPresets()
      .then((r) => setItems(r.items))
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : String(e)))
  }, [])

  useEffect(load, [load])

  const selected = useMemo(
    () => (items ?? []).find((p) => p.id === selectedId) ?? null,
    [items, selectedId]
  )

  const beginNew = () => {
    setSelectedId(null)
    setForm(DEFAULT_STATE)
    setFormErr(null)
  }

  const beginEdit = (p: Preset) => {
    setSelectedId(p.id)
    setForm({
      id: p.id,
      name: p.name,
      category: p.category,
      frontmatterJson: JSON.stringify(p.frontmatter, null, 2),
      body: p.body
    })
    setFormErr(null)
  }

  const handleSave = async () => {
    setFormErr(null)
    let fm: Record<string, unknown>
    try {
      const parsed = JSON.parse(form.frontmatterJson) as unknown
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('frontmatter는 객체여야 합니다.')
      }
      fm = parsed as Record<string, unknown>
    } catch (e) {
      setFormErr(`Frontmatter JSON 파싱 실패: ${e instanceof Error ? e.message : String(e)}`)
      return
    }
    if (!form.name.trim()) {
      setFormErr('이름을 입력하세요.')
      return
    }
    setSaving(true)
    try {
      const p = await savePreset({
        id: form.id ?? undefined,
        name: form.name.trim(),
        category: form.category,
        frontmatter: fm,
        body: form.body
      })
      load()
      setSelectedId(p.id)
      setForm((prev) => ({ ...prev, id: p.id }))
    } catch (e) {
      setFormErr(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selected) return
    if (!window.confirm(`"${selected.name}" 프리셋을 삭제할까요?`)) return
    try {
      await deletePreset(selected.id)
      beginNew()
      load()
    } catch (e) {
      setFormErr(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <div>
      <header className="page-head page-head--row">
        <div>
          <h1>프리셋</h1>
          <p className="muted small">카테고리별 Frontmatter·본문 템플릿</p>
        </div>
        <button type="button" className="btn" onClick={beginNew}>
          새 프리셋
        </button>
      </header>

      {err && <div className="err">오류: {err}</div>}

      <div className="preset-layout">
        <aside className="card preset-layout__list">
          {items === null && <p className="muted small">불러오는 중…</p>}
          {items && items.length === 0 && <p className="muted small">저장된 프리셋이 없습니다.</p>}
          {items?.map((p) => (
            <button
              key={p.id}
              type="button"
              className={
                p.id === selectedId
                  ? 'preset-layout__item preset-layout__item--active'
                  : 'preset-layout__item'
              }
              onClick={() => beginEdit(p)}
            >
              <div style={{ fontWeight: 500 }}>{p.name}</div>
              <div className="muted small">{CATEGORY_LABEL[p.category]}</div>
            </button>
          ))}
        </aside>

        <section className="card preset-layout__editor">
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input
              type="text"
              className="input"
              placeholder="프리셋 이름"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              style={{ flex: 1 }}
            />
            <select
              className="input"
              value={form.category}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, category: e.target.value as Category }))
              }
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABEL[c]}
                </option>
              ))}
            </select>
          </div>

          <label className="muted small" style={{ display: 'block', marginBottom: 4 }}>
            Frontmatter (JSON)
          </label>
          <textarea
            className="input"
            rows={10}
            style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12 }}
            value={form.frontmatterJson}
            onChange={(e) => setForm((prev) => ({ ...prev, frontmatterJson: e.target.value }))}
          />

          <label
            className="muted small"
            style={{ display: 'block', marginTop: 10, marginBottom: 4 }}
          >
            본문 템플릿 (Markdown)
          </label>
          <textarea
            className="input"
            rows={10}
            style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12 }}
            value={form.body}
            onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
          />

          {formErr && (
            <div className="err" style={{ marginTop: 10 }}>
              {formErr}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button type="button" className="btn" onClick={handleSave} disabled={saving}>
              {saving ? '저장 중…' : form.id ? '덮어쓰기' : '새로 저장'}
            </button>
            {selected && (
              <button
                type="button"
                className="btn btn--danger"
                onClick={handleDelete}
                disabled={saving}
              >
                삭제
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
