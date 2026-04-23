import { Decoration, EditorView, WidgetType } from '@codemirror/view'
import type { DecorationSet } from '@codemirror/view'
import { StateField, type EditorState, type Range } from '@codemirror/state'

export type WysiwygCtx = {
  mediaBase?: string
}

export type HeadingLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6

export type WysiwygOptions = {
  ctx: WysiwygCtx
  onHeadingLevelChange?: (level: HeadingLevel) => void
}

function resolveSrc(src: string, ctx: WysiwygCtx): string {
  if (!src) return ''
  if (/^https?:\/\//i.test(src) || src.startsWith('//') || src.startsWith('data:')) return src
  if (src.startsWith('/')) return src
  if (!ctx.mediaBase) return src
  const base = ctx.mediaBase.replace(/\/$/, '')
  const trimmed = src.replace(/^\.\//, '')
  const enc = trimmed.split('/').map((s) => encodeURIComponent(s)).join('/')
  return `${base}/${enc}`
}

class ImageLineWidget extends WidgetType {
  constructor(
    readonly src: string,
    readonly alt: string,
    readonly title: string,
    readonly ctx: WysiwygCtx
  ) {
    super()
  }
  eq(other: ImageLineWidget): boolean {
    return (
      other.src === this.src &&
      other.alt === this.alt &&
      other.title === this.title &&
      other.ctx.mediaBase === this.ctx.mediaBase
    )
  }
  toDOM(): HTMLElement {
    const wrap = document.createElement('div')
    wrap.className = 'cm-img-widget'
    wrap.setAttribute('role', 'button')
    wrap.setAttribute('tabindex', '-1')
    wrap.title = '클릭해서 이미지 마크다운 편집'
    const img = document.createElement('img')
    img.className = 'cm-img-widget__img'
    img.src = resolveSrc(this.src, this.ctx)
    img.alt = this.alt
    if (this.title) img.title = this.title
    img.loading = 'lazy'
    img.decoding = 'async'
    img.onerror = () => {
      wrap.classList.add('cm-img-widget--error')
    }
    wrap.appendChild(img)
    const cap = document.createElement('div')
    cap.className = 'cm-img-widget__caption'
    cap.textContent = this.alt || this.src
    wrap.appendChild(cap)
    return wrap
  }
  ignoreEvent(): boolean {
    return false
  }
}

const HEADING_RE = /^(#{1,6})\s/
const IMAGE_LINE_RE = /^!\[([^\]]*)\]\(\s*([^)\s]+)(?:\s+"([^"]*)")?\s*\)\s*$/

function computeDecorations(state: EditorState, ctx: WysiwygCtx): DecorationSet {
  const ranges: Range<Decoration>[] = []
  const { doc, selection } = state
  const head = selection.main.head
  const lineCount = doc.lines

  for (let i = 1; i <= lineCount; i++) {
    const line = doc.line(i)
    const text = line.text
    const onLine = head >= line.from && head <= line.to

    const h = HEADING_RE.exec(text)
    if (h) {
      const level = h[1].length
      ranges.push(Decoration.line({ class: `cm-h cm-h${level}` }).range(line.from))
      if (!onLine) {
        ranges.push(
          Decoration.replace({}).range(line.from, line.from + h[0].length)
        )
      }
      continue
    }

    const im = IMAGE_LINE_RE.exec(text)
    if (im && !onLine && line.to > line.from) {
      const [, alt, src, title = ''] = im
      ranges.push(
        Decoration.replace({
          widget: new ImageLineWidget(src, alt, title, ctx),
          block: true
        }).range(line.from, line.to)
      )
    }
  }

  return Decoration.set(ranges, true)
}

function readHeadingLevel(text: string): HeadingLevel {
  const m = HEADING_RE.exec(text)
  return (m ? m[1].length : 0) as HeadingLevel
}

export function createWysiwyg(opts: WysiwygOptions) {
  const { ctx, onHeadingLevelChange } = opts

  const field = StateField.define<DecorationSet>({
    create(state) {
      return computeDecorations(state, ctx)
    },
    update(value, tr) {
      if (tr.docChanged || tr.selection) {
        return computeDecorations(tr.state, ctx)
      }
      return value
    },
    provide: (f) => EditorView.decorations.from(f)
  })

  const levelListener = EditorView.updateListener.of((u) => {
    if (!onHeadingLevelChange) return
    if (!u.docChanged && !u.selectionSet) return
    const line = u.state.doc.lineAt(u.state.selection.main.head)
    onHeadingLevelChange(readHeadingLevel(line.text))
  })

  const widgetClick = EditorView.domEventHandlers({
    mousedown(e, view) {
      const t = e.target as HTMLElement | null
      if (!t) return false
      const widget = t.closest('.cm-img-widget') as HTMLElement | null
      if (!widget) return false
      const pos = view.posAtDOM(widget)
      if (pos == null) return false
      e.preventDefault()
      view.dispatch({ selection: { anchor: pos } })
      view.focus()
      return true
    }
  })

  return [field, levelListener, widgetClick]
}
