import { useState, type ReactNode } from 'react'

type Props = {
  title: string
  hint?: string
  defaultOpen?: boolean
  required?: boolean
  badge?: string
  children: ReactNode
}

export default function FormSection({
  title,
  hint,
  defaultOpen = true,
  required = false,
  badge,
  children
}: Props) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className={open ? 'form-section form-section--open' : 'form-section'}>
      <button
        type="button"
        className="form-section__head"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="form-section__title">
          {title}
          {required && <span className="form-section__required" aria-label="필수">●</span>}
        </span>
        {badge && <span className="form-section__badge">{badge}</span>}
        <span aria-hidden className="form-section__caret">▾</span>
      </button>
      {hint && open && <p className="form-section__hint">{hint}</p>}
      {open && <div className="form-section__body">{children}</div>}
    </section>
  )
}
