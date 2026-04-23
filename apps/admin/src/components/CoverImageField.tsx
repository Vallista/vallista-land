import { useEffect, useRef, useState, type ClipboardEvent, type DragEvent } from 'react'
import type { UploadTarget } from '@/lib/types'
import { uploadMedia } from '@/lib/api'

type Props = {
  value: string
  onChange: (next: string) => void
  uploadTarget?: UploadTarget
  previewBase?: string
}

function resolvePreview(src: string, base?: string): string {
  if (!src) return ''
  const trimmed = src.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('//') || trimmed.startsWith('data:')) return trimmed
  if (trimmed.startsWith('/')) return trimmed
  if (!base) return ''
  const b = base.replace(/\/$/, '')
  const stripped = trimmed.replace(/^\.\//, '')
  const enc = stripped.split('/').map((s) => encodeURIComponent(s)).join('/')
  return `${b}/${enc}`
}

function isImageFile(f: File): boolean {
  return f.type.startsWith('image/')
}

export default function CoverImageField({ value, onChange, uploadTarget, previewBase }: Props) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [drag, setDrag] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const preview = resolvePreview(value, previewBase)

  async function upload(file: File) {
    if (!uploadTarget) {
      setErr('업로드 대상이 아직 준비되지 않았습니다.')
      return
    }
    setErr(null)
    setBusy(true)
    try {
      const r = await uploadMedia(uploadTarget, file)
      onChange(r.relativePath)
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDrag(false)
    const f = e.dataTransfer.files?.[0]
    if (f && isImageFile(f)) void upload(f)
  }

  const onPaste = (e: ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.kind === 'file') {
        const f = item.getAsFile()
        if (f && isImageFile(f)) {
          e.preventDefault()
          void upload(f)
          return
        }
      }
    }
  }

  useEffect(() => {
    if (!err) return
    const id = window.setTimeout(() => setErr(null), 6000)
    return () => window.clearTimeout(id)
  }, [err])

  return (
    <div className="cover-field">
      <div
        className={
          'cover-drop' +
          (drag ? ' cover-drop--drag' : '') +
          (preview ? ' cover-drop--filled' : '')
        }
        onDragOver={(e) => {
          e.preventDefault()
          setDrag(true)
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        onPaste={onPaste}
        tabIndex={0}
        role="button"
        aria-label="커버 이미지 업로드 영역"
        onClick={() => {
          if (!preview && !busy) fileRef.current?.click()
        }}
      >
        {preview ? (
          <img src={preview} alt="커버 미리보기" className="cover-drop__img" />
        ) : (
          <div className="cover-drop__empty">
            <div className="cover-drop__icon" aria-hidden>⬆︎</div>
            <div className="cover-drop__line">클릭 · 드래그 · 붙여넣기로 업로드</div>
            <div className="cover-drop__hint">16:9 권장 · 카드·OG 이미지로 사용</div>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0]
            if (f) await upload(f)
            e.target.value = ''
          }}
        />
      </div>

      <div className="cover-field__row">
        <input
          type="text"
          className="cover-field__path"
          value={value}
          placeholder="./assets/cover.png 또는 https://..."
          onChange={(e) => onChange(e.target.value)}
        />
        <div className="cover-field__btns">
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            disabled={!uploadTarget || busy}
            onClick={() => fileRef.current?.click()}
          >
            {busy ? '업로드 중…' : preview ? '교체' : '업로드'}
          </button>
          {value && (
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => onChange('')}
            >
              제거
            </button>
          )}
        </div>
      </div>

      {err && <p className="fm-hint err-hint">{err}</p>}
      {!uploadTarget && (
        <p className="fm-hint">업로드는 글이 준비된 뒤 가능합니다.</p>
      )}
    </div>
  )
}
