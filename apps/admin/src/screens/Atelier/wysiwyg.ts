import { Decoration, EditorView, WidgetType } from '@codemirror/view';
import type { DecorationSet } from '@codemirror/view';
import { StateField, type EditorState, type Range } from '@codemirror/state';
import { resolveAssetPath } from '@vallista/markdown';
import { loadAssetUrl } from '../../lib/assetCache';

export type WysiwygCtx = {
  /** vault 내 문서 경로 (예: "articles/foo/index.md"). 상대 이미지 해석 기준. */
  docPath: string;
};

export type HeadingLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6;

class ImageLineWidget extends WidgetType {
  constructor(
    readonly src: string,
    readonly alt: string,
    readonly title: string,
    readonly docPath: string,
  ) {
    super();
  }
  eq(other: ImageLineWidget): boolean {
    return (
      other.src === this.src &&
      other.alt === this.alt &&
      other.title === this.title &&
      other.docPath === this.docPath
    );
  }
  toDOM(): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'cm-img-widget';
    wrap.setAttribute('role', 'button');
    wrap.setAttribute('tabindex', '-1');
    wrap.title = '클릭해서 이미지 마크다운 편집';
    wrap.draggable = false;
    wrap.addEventListener('dragstart', (e) => e.preventDefault());

    const img = document.createElement('img');
    img.className = 'cm-img-widget__img';
    img.alt = this.alt;
    if (this.title) img.title = this.title;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.draggable = false;
    img.onerror = () => {
      wrap.classList.add('cm-img-widget--error');
    };
    wrap.appendChild(img);

    if (/^https?:\/\//i.test(this.src) || this.src.startsWith('//') || this.src.startsWith('data:')) {
      img.src = this.src;
    } else {
      const resolved = resolveAssetPath(this.docPath, this.src);
      if (resolved) {
        loadAssetUrl(resolved).then(
          (url) => {
            img.src = url;
          },
          () => {
            wrap.classList.add('cm-img-widget--error');
          },
        );
      } else {
        wrap.classList.add('cm-img-widget--error');
      }
    }

    const cap = document.createElement('div');
    cap.className = 'cm-img-widget__caption';
    cap.textContent = this.alt || this.src;
    wrap.appendChild(cap);
    return wrap;
  }
  ignoreEvent(): boolean {
    return false;
  }
}

const HEADING_RE = /^(#{1,6})\s/;
const IMAGE_LINE_RE = /^!\[([^\]]*)\]\(\s*([^)\s]+)(?:\s+"([^"]*)")?\s*\)\s*$/;

function computeDecorations(state: EditorState, ctx: WysiwygCtx): DecorationSet {
  const ranges: Range<Decoration>[] = [];
  const { doc, selection } = state;
  const head = selection.main.head;
  const lineCount = doc.lines;

  for (let i = 1; i <= lineCount; i += 1) {
    const line = doc.line(i);
    const text = line.text;
    const onLine = head >= line.from && head <= line.to;

    const h = HEADING_RE.exec(text);
    if (h) {
      const level = h[1]!.length;
      ranges.push(Decoration.line({ class: `cm-h cm-h${level}` }).range(line.from));
      if (!onLine) {
        ranges.push(Decoration.replace({}).range(line.from, line.from + h[0].length));
      }
      continue;
    }

    const im = IMAGE_LINE_RE.exec(text);
    if (im && !onLine && line.to > line.from) {
      const alt = im[1] ?? '';
      const src = im[2] ?? '';
      const title = im[3] ?? '';
      ranges.push(
        Decoration.replace({
          widget: new ImageLineWidget(src, alt, title, ctx.docPath),
          block: true,
        }).range(line.from, line.to),
      );
    }
  }

  return Decoration.set(ranges, true);
}

export function createWysiwyg(ctx: WysiwygCtx) {
  const field = StateField.define<DecorationSet>({
    create(state) {
      return computeDecorations(state, ctx);
    },
    update(value, tr) {
      if (tr.docChanged || tr.selection) {
        return computeDecorations(tr.state, ctx);
      }
      return value;
    },
    provide: (f) => EditorView.decorations.from(f),
  });

  const widgetClick = EditorView.domEventHandlers({
    mousedown(e, view) {
      const t = e.target as HTMLElement | null;
      if (!t) return false;
      const widget = t.closest('.cm-img-widget') as HTMLElement | null;
      if (!widget) return false;
      const pos = view.posAtDOM(widget);
      if (pos == null) return false;
      e.preventDefault();
      view.dispatch({ selection: { anchor: pos } });
      view.focus();
      return true;
    },
  });

  return [field, widgetClick];
}
