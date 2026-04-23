import { useMemo } from 'react'

type Props = {
  value: string
  onChange: (next: string) => void
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function toInputValue(raw: string): string {
  if (!raw) return ''
  const cleaned = String(raw).replace(/^['"`]+|['"`]+$/g, '').trim()
  if (!cleaned) return ''
  const t = Date.parse(cleaned)
  if (Number.isNaN(t)) return ''
  const d = new Date(t)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromInputValue(v: string): string {
  if (!v) return ''
  // datetime-local 값(YYYY-MM-DDTHH:mm) → blog 관례인 "YYYY-MM-DD HH:MM:SS"
  const iso = v.includes(':') && v.length === 16 ? `${v}:00` : v
  return iso.replace('T', ' ')
}

export default function DateField({ value, onChange }: Props) {
  const inputVal = useMemo(() => toInputValue(value), [value])
  return (
    <input
      type="datetime-local"
      className="date-field"
      value={inputVal}
      onChange={(e) => onChange(fromInputValue(e.target.value))}
    />
  )
}
