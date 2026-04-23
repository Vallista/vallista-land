import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'

export type DropdownOption<T extends string = string> = {
  value: T
  label: string
  disabled?: boolean
}

type Props<T extends string> = {
  value: T | ''
  options: readonly DropdownOption<T>[]
  onChange: (v: T) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export default function Dropdown<T extends string>({
  value,
  options,
  onChange,
  placeholder = '선택',
  disabled,
  className
}: Props<T>) {
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState(-1)
  const rootRef = useRef<HTMLDivElement>(null)
  const btnId = useId()
  const listId = useId()

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current) return
      if (!rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  useEffect(() => {
    if (!open) setFocused(-1)
  }, [open])

  const current = options.find((o) => o.value === value)

  const select = (o: DropdownOption<T>) => {
    if (o.disabled) return
    onChange(o.value)
    setOpen(false)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (!open) {
        setOpen(true)
        return
      }
      if (focused >= 0 && options[focused]) select(options[focused])
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!open) setOpen(true)
      setFocused((i) => Math.min(options.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) setOpen(true)
      setFocused((i) => (i <= 0 ? 0 : i - 1))
    } else if (e.key === 'Escape') {
      setOpen(false)
    } else if (e.key === 'Tab') {
      setOpen(false)
    }
  }

  return (
    <div ref={rootRef} className={`dd ${className ?? ''}`.trim()}>
      <button
        id={btnId}
        type="button"
        className={open ? 'dd-btn dd-btn--open' : 'dd-btn'}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onKeyDown}
      >
        <span
          className={
            current ? 'dd-btn__label' : 'dd-btn__label dd-btn__label--placeholder'
          }
        >
          {current ? current.label : placeholder}
        </span>
        <span aria-hidden className="dd-btn__caret">▾</span>
      </button>
      {open && (
        <ul id={listId} role="listbox" className="dd-list">
          {options.map((o, i) => (
            <li
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              aria-disabled={o.disabled || undefined}
              className={
                'dd-option' +
                (o.value === value ? ' dd-option--active' : '') +
                (o.disabled ? ' dd-option--disabled' : '') +
                (i === focused ? ' dd-option--focused' : '')
              }
              onMouseEnter={() => setFocused(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => select(o)}
            >
              {o.label}
            </li>
          ))}
          {options.length === 0 && (
            <li className="dd-option dd-option--disabled">항목 없음</li>
          )}
        </ul>
      )}
    </div>
  )
}
