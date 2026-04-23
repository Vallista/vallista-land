import { useMemo } from 'react'
import { renderMarkdown } from '@/lib/markdown-render'

type Props = {
  source: string
  mediaBase?: string
  title?: string
  dek?: string
  date?: string
  tags?: string[]
  series?: string
  image?: string
}

function resolveAsset(src: string | undefined, mediaBase?: string): string {
  if (!src) return ''
  if (/^https?:\/\//i.test(src) || src.startsWith('//') || src.startsWith('data:')) return src
  if (src.startsWith('/')) return src
  if (!mediaBase) return src
  const base = mediaBase.replace(/\/$/, '')
  const trimmed = src.replace(/^\.\//, '')
  const enc = trimmed.split('/').map((s) => encodeURIComponent(s)).join('/')
  return `${base}/${enc}`
}

export default function MarkdownPreview({
  source,
  mediaBase,
  title,
  dek,
  date,
  tags = [],
  series,
  image
}: Props) {
  const html = useMemo(
    () => renderMarkdown(source || '', { mediaBase }),
    [source, mediaBase]
  )
  const dateLabel = useMemo(() => {
    if (!date) return ''
    const cleaned = String(date).replace(/^['"`]+|['"`]+$/g, '').trim()
    const t = Date.parse(cleaned)
    if (Number.isNaN(t)) return cleaned
    return new Date(t).toISOString().slice(0, 10).replace(/-/g, '.')
  }, [date])

  const splashSrc = useMemo(() => resolveAsset(image, mediaBase), [image, mediaBase])

  return (
    <div className="preview-scroll">
      <article className="preview">
        {(tags.length > 0 || series) && (
          <div className="preview__chips">
            {tags.slice(0, 1).map((t) => (
              <span key={t} className="preview__chip">{t}</span>
            ))}
            {series && <span className="preview__chip preview__chip--blue">{series}</span>}
          </div>
        )}
        {title && <h1 className="preview__h1">{title}</h1>}
        {dek && <p className="preview__dek">{dek}</p>}
        {dateLabel && (
          <div className="preview__byline">
            <time>{dateLabel}</time>
          </div>
        )}
        {splashSrc && (
          <figure className="preview__splash">
            <img src={splashSrc} alt={title ?? ''} loading="lazy" />
          </figure>
        )}
        <div className="preview__prose" dangerouslySetInnerHTML={{ __html: html }} />
      </article>
    </div>
  )
}
