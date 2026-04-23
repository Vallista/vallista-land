import { useEffect, useRef } from 'react'

type Props = {
  open: boolean
  title: string
  onClose: () => void
  onSubmit?: () => void
  children: React.ReactNode
  submitLabel?: string
  cancelLabel?: string
  submitDisabled?: boolean
}

export default function Dialog({
  open,
  title,
  onClose,
  onSubmit,
  children,
  submitLabel = '확인',
  cancelLabel = '취소',
  submitDisabled
}: Props) {
  const firstFieldRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const el = firstFieldRef.current?.querySelector<HTMLInputElement | HTMLTextAreaElement>(
      'input, textarea'
    )
    el?.focus()
    el?.select?.()
  }, [open])

  if (!open) return null
  return (
    <div
      className="dlg-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <form
        className="dlg"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onSubmit={(e) => {
          e.preventDefault()
          if (!submitDisabled) onSubmit?.()
        }}
      >
        <div className="dlg__head">{title}</div>
        <div className="dlg__body" ref={firstFieldRef}>
          {children}
        </div>
        <div className="dlg__foot">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            {cancelLabel}
          </button>
          {onSubmit && (
            <button type="submit" className="btn" disabled={submitDisabled}>
              {submitLabel}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
