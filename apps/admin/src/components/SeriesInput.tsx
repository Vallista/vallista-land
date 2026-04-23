import { useMemo, useRef, useState, type KeyboardEvent } from 'react'

type Suggestion = { value: string; count: number }

type Props = {
  name: string
  priority: string
  onChange: (next: { name: string; priority: string }) => void
  suggestions?: Suggestion[]
}

export default function SeriesInput({
  name,
  priority,
  onChange,
  suggestions = []
}: Props) {
  const [open, setOpen] = useState(false)
  const [focusIdx, setFocusIdx] = useState(-1)
  const nameRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    const q = name.trim().toLowerCase()
    if (!q) return suggestions.slice(0, 8)
    return suggestions.filter((s) => s.value.toLowerCase().includes(q)).slice(0, 8)
  }, [name, suggestions])

  const pick = (v: string) => {
    onChange({ name: v, priority })
    setOpen(false)
    setFocusIdx(-1)
  }

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' && filtered.length > 0) {
      e.preventDefault()
      setOpen(true)
      setFocusIdx((i) => Math.min(filtered.length - 1, i + 1))
    } else if (e.key === 'ArrowUp' && filtered.length > 0) {
      e.preventDefault()
      setFocusIdx((i) => (i <= 0 ? 0 : i - 1))
    } else if (e.key === 'Enter' && focusIdx >= 0) {
      e.preventDefault()
      pick(filtered[focusIdx]!.value)
    } else if (e.key === 'Escape') {
      setOpen(false)
      setFocusIdx(-1)
    }
  }

  return (
    <div className="series-input">
      <div className="series-input__row">
        <div className="series-input__combo">
          <input
            ref={nameRef}
            type="text"
            className="series-input__name"
            value={name}
            placeholder="시리즈 이름 (없으면 비워두기)"
            onChange={(e) => {
              onChange({ name: e.target.value, priority })
              setOpen(true)
              setFocusIdx(-1)
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => window.setTimeout(() => setOpen(false), 120)}
            onKeyDown={onKey}
          />
          {name && (
            <button
              type="button"
              className="series-input__clear"
              aria-label="시리즈 제거"
              onClick={() => onChange({ name: '', priority: '' })}
            >
              ×
            </button>
          )}
          {open && filtered.length > 0 && (
            <ul className="tag-suggest series-input__suggest" role="listbox">
              {filtered.map((s, i) => (
                <li
                  key={s.value}
                  role="option"
                  aria-selected={i === focusIdx}
                  className={i === focusIdx ? 'tag-suggest__item tag-suggest__item--active' : 'tag-suggest__item'}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    pick(s.value)
                  }}
                  onMouseEnter={() => setFocusIdx(i)}
                >
                  <span>{s.value}</span>
                  <span className="tag-suggest__count">{s.count}편</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <input
          type="number"
          inputMode="numeric"
          className="series-input__priority"
          value={priority}
          placeholder="순번"
          aria-label="시리즈 순번"
          disabled={!name}
          onChange={(e) => onChange({ name, priority: e.target.value })}
        />
      </div>
      {name && (
        <p className="series-input__hint">
          {priority ? `${priority}번 · ` : ''}시리즈 내 순서를 숫자로 지정하면 목록이 이 값으로 정렬됩니다.
        </p>
      )}
    </div>
  )
}
