import { useMemo, useRef, useState, type KeyboardEvent } from 'react'

type Suggestion = { value: string; count: number }

type Props = {
  value: string[]
  onChange: (next: string[]) => void
  suggestions?: Suggestion[]
  placeholder?: string
  maxSuggestions?: number
}

export default function TagInput({
  value,
  onChange,
  suggestions = [],
  placeholder = '태그 입력 · Enter 로 추가',
  maxSuggestions = 6
}: Props) {
  const [draft, setDraft] = useState('')
  const [focusIdx, setFocusIdx] = useState(-1)
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    const q = draft.trim().toLowerCase()
    const taken = new Set(value)
    const pool = suggestions.filter((s) => !taken.has(s.value))
    if (!q) return pool.slice(0, maxSuggestions)
    return pool
      .filter((s) => s.value.toLowerCase().includes(q))
      .slice(0, maxSuggestions)
  }, [draft, suggestions, value, maxSuggestions])

  const add = (raw: string) => {
    const t = raw.trim()
    setDraft('')
    setFocusIdx(-1)
    if (!t) return
    if (value.includes(t)) return
    onChange([...value, t])
  }

  const remove = (t: string) => {
    onChange(value.filter((v) => v !== t))
  }

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      if (focusIdx >= 0 && filtered[focusIdx]) {
        add(filtered[focusIdx].value)
      } else {
        add(draft)
      }
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      e.preventDefault()
      onChange(value.slice(0, -1))
    } else if (e.key === 'ArrowDown' && filtered.length > 0) {
      e.preventDefault()
      setOpen(true)
      setFocusIdx((i) => Math.min(filtered.length - 1, i + 1))
    } else if (e.key === 'ArrowUp' && filtered.length > 0) {
      e.preventDefault()
      setFocusIdx((i) => (i <= 0 ? 0 : i - 1))
    } else if (e.key === 'Escape') {
      setOpen(false)
      setFocusIdx(-1)
    }
  }

  return (
    <div className="tag-input">
      <div className="tag-input__field" onClick={() => inputRef.current?.focus()}>
        {value.map((t) => (
          <span key={t} className="tag-chip">
            <span className="tag-chip__label">{t}</span>
            <button
              type="button"
              className="tag-chip__x"
              aria-label={`${t} 삭제`}
              onClick={(e) => {
                e.stopPropagation()
                remove(t)
              }}
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          className="tag-input__text"
          value={draft}
          placeholder={value.length === 0 ? placeholder : ''}
          onChange={(e) => {
            setDraft(e.target.value)
            setOpen(true)
            setFocusIdx(-1)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 120)
            if (draft.trim()) add(draft)
          }}
          onKeyDown={onKey}
        />
      </div>
      {open && filtered.length > 0 && (
        <ul className="tag-suggest" role="listbox">
          {filtered.map((s, i) => (
            <li
              key={s.value}
              role="option"
              aria-selected={i === focusIdx}
              className={i === focusIdx ? 'tag-suggest__item tag-suggest__item--active' : 'tag-suggest__item'}
              onMouseDown={(e) => {
                e.preventDefault()
                add(s.value)
              }}
              onMouseEnter={() => setFocusIdx(i)}
            >
              <span>{s.value}</span>
              <span className="tag-suggest__count">{s.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
