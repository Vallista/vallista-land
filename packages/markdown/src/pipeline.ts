import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeStringify from 'rehype-stringify';

interface MdNode {
  type: string;
  children?: MdNode[];
  url?: string;
  alt?: string | null;
  title?: string | null;
  value?: string;
  data?: { hName?: string; [k: string]: unknown };
}

export interface RenderOptions {
  /**
   * docPath: vault 내 상대 경로 (예: "articles/foo/index.md").
   * 이 경로를 기준으로 상대 이미지(`./assets/x.png`)를 vault 절대 경로로 해석한다.
   * undefined 면 image transform 생략.
   */
  docPath?: string;
}

export interface RenderResult {
  html: string;
}

export function renderMarkdown(source: string, options: RenderOptions = {}): RenderResult {
  const docPath = options.docPath;
  const file = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(() => (tree: MdNode) => {
      if (!docPath) return;
      transformImages(tree, docPath);
    })
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, { behavior: 'append' })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .processSync(source ?? '');
  return { html: String(file) };
}

export function resolveAssetPath(docPath: string, ref: string): string | null {
  if (!ref) return null;
  if (/^https?:\/\//i.test(ref)) return null;
  if (ref.startsWith('//') || ref.startsWith('data:') || ref.startsWith('blob:')) return null;
  if (ref.startsWith('/')) return ref.slice(1);
  const docDir = docPath.split('/').slice(0, -1).filter(Boolean);
  const stack = [...docDir];
  for (const seg of ref.split('/')) {
    if (seg === '' || seg === '.') continue;
    if (seg === '..') stack.pop();
    else stack.push(seg);
  }
  return stack.join('/');
}

function transformImages(tree: MdNode, docPath: string): void {
  walk(tree);

  function walk(parent: MdNode): void {
    const children = parent.children;
    if (!Array.isArray(children)) return;
    for (let i = 0; i < children.length; i += 1) {
      const node = children[i];
      if (!node) continue;

      // image only paragraph(공백·br 한정) → paragraph unwrap → figure를 블록 레벨로 끌어올림.
      if (node.type === 'paragraph' && Array.isArray(node.children)) {
        const meaningful = node.children.filter((c) => !isFiller(c));
        if (
          meaningful.length === 1 &&
          meaningful[0] &&
          meaningful[0].type === 'image'
        ) {
          children[i] = imageToHtml(meaningful[0], docPath);
          continue;
        }
      }

      if (node.type === 'image') {
        children[i] = imageToHtml(node, docPath);
        continue;
      }
      if (Array.isArray(node.children)) {
        walk(node);
      }
    }
  }
}

function isFiller(n: MdNode | undefined): boolean {
  if (!n) return true;
  if (n.type === 'break') return true;
  if (n.type === 'text' && typeof n.value === 'string' && n.value.trim().length === 0) {
    return true;
  }
  return false;
}

function imageToHtml(node: MdNode, docPath: string): MdNode {
  const alt = typeof node.alt === 'string' ? node.alt : '';
  const url = typeof node.url === 'string' ? node.url : '';
  const title = typeof node.title === 'string' ? node.title : '';
  const resolved = resolveAssetPath(docPath, url);
  const titleAttr = title ? ` title="${escAttr(title)}"` : '';
  let imgAttrs: string;
  if (resolved !== null) {
    imgAttrs = `alt="${escAttr(alt)}"${titleAttr} data-asset-path="${escAttr(resolved)}"`;
  } else {
    imgAttrs = `src="${escAttr(url)}" alt="${escAttr(alt)}"${titleAttr}`;
  }
  const captionHtml = alt
    ? `<figcaption class="img-card__caption">${escAttr(alt)}</figcaption>`
    : '';
  return {
    type: 'html',
    value: `<figure class="img-card"><img ${imgAttrs} loading="lazy" decoding="async" />${captionHtml}</figure>`,
  };
}

function escAttr(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
