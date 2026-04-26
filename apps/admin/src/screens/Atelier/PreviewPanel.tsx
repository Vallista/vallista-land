import { useEffect, useMemo, useRef } from 'react';
import { loadAssetUrl } from '../../lib/assetCache';
import { useDoc } from './state';
import { renderMarkdown, resolveAssetPath } from './render';

export function PreviewPanel() {
  const { body, frontmatter, path } = useDoc();
  const { html } = useMemo(() => renderMarkdown(body, path), [body, path]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const title = strOr(frontmatter.title, '');
  const dek = strOr(frontmatter.dek ?? frontmatter.description, '');
  const tags = tagsAsArray(frontmatter.tags);
  const coverImage = strOr(frontmatter.image, '');
  const coverResolved = coverImage ? resolveAssetPath(path, coverImage) : null;

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const imgs = Array.from(root.querySelectorAll<HTMLImageElement>('img[data-asset-path]'));
    let alive = true;
    imgs.forEach((img) => {
      if (img.dataset.loaded === '1' || img.dataset.loading === '1') return;
      const ap = img.getAttribute('data-asset-path');
      if (!ap) return;
      img.dataset.loading = '1';
      loadAssetUrl(ap).then(
        (url) => {
          if (!alive) return;
          img.src = url;
          img.dataset.loaded = '1';
          delete img.dataset.loading;
        },
        () => {
          if (!alive) return;
          img.dataset.error = '1';
          delete img.dataset.loading;
        },
      );
    });
    return () => {
      alive = false;
    };
  }, [html, coverResolved]);

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        padding: '20px 22px 32px',
      }}
    >
      <style>{previewCss}</style>
      <div ref={containerRef} className="pensmith-preview">
        {coverResolved && (
          <figure className="md-img cover">
            <img data-asset-path={coverResolved} alt={title} loading="lazy" decoding="async" />
          </figure>
        )}
        {title && <h1 className="preview-title">{title}</h1>}
        {dek && <p className="preview-dek">{dek}</p>}
        {tags.length > 0 && (
          <div className="preview-tags">
            {tags.map((t) => (
              <span key={t} className="preview-tag">
                #{t}
              </span>
            ))}
          </div>
        )}
        <div className="preview-body" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}

function strOr(v: unknown, fallback: string): string {
  if (typeof v === 'string') return v;
  return fallback;
}

function tagsAsArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String).filter((s) => s.trim().length > 0);
  if (typeof v === 'string' && v.trim().length > 0) return [v];
  return [];
}

const previewCss = `
.pensmith-preview {
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: 14px;
  line-height: 1.65;
  word-break: keep-all;
  overflow-wrap: break-word;
}
.pensmith-preview .preview-title {
  margin: 6px 0 6px;
  font-family: var(--font-serif);
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.2px;
  line-height: 1.25;
}
.pensmith-preview .preview-dek {
  margin: 0 0 12px;
  color: var(--ink-mute);
  font-size: 13px;
  font-style: italic;
  line-height: 1.55;
}
.pensmith-preview .preview-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 14px;
}
.pensmith-preview .preview-tag {
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--ink-mute);
  padding: 2px 7px;
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: 999px;
}
.pensmith-preview .preview-body {
  margin-top: 14px;
}
.pensmith-preview .preview-body > *:first-child { margin-top: 0; }
.pensmith-preview h1, .pensmith-preview h2, .pensmith-preview h3, .pensmith-preview h4 {
  font-family: var(--font-serif);
  font-weight: 700;
  letter-spacing: -0.15px;
  line-height: 1.3;
  margin: 1.4em 0 0.4em;
  color: var(--ink);
}
.pensmith-preview h1 { font-size: 19px; }
.pensmith-preview h2 { font-size: 17px; padding-bottom: 4px; border-bottom: 1px solid var(--line); }
.pensmith-preview h3 { font-size: 15px; }
.pensmith-preview h4 { font-size: 14px; }
.pensmith-preview h2 a, .pensmith-preview h3 a, .pensmith-preview h4 a {
  color: inherit;
  text-decoration: none;
}
.pensmith-preview p { margin: 0.7em 0; }
.pensmith-preview a { color: var(--blue); }
.pensmith-preview a:hover { text-decoration: underline; }
.pensmith-preview ul, .pensmith-preview ol {
  margin: 0.7em 0;
  padding-left: 1.25em;
}
.pensmith-preview li { margin: 0.25em 0; }
.pensmith-preview blockquote {
  margin: 0.9em 0;
  padding: 4px 12px;
  border-left: 3px solid var(--line);
  color: var(--ink-mute);
  font-style: italic;
}
.pensmith-preview code {
  font-family: var(--font-mono);
  font-size: 11.5px;
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: 3px;
  padding: 0.1em 0.35em;
}
.pensmith-preview pre {
  font-family: var(--font-mono);
  font-size: 11.5px;
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: 5px;
  padding: 10px 12px;
  overflow-x: auto;
  line-height: 1.5;
}
.pensmith-preview pre code {
  background: transparent;
  border: none;
  padding: 0;
  font-size: inherit;
}
.pensmith-preview hr {
  border: none;
  border-top: 1px solid var(--line);
  margin: 1.5em 0;
}
.pensmith-preview table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  margin: 0.9em 0;
}
.pensmith-preview th, .pensmith-preview td {
  padding: 6px 8px;
  border: 1px solid var(--line);
  text-align: left;
}
.pensmith-preview th { background: var(--bg); }
.pensmith-preview .md-img {
  margin: 1em 0;
  text-align: center;
}
.pensmith-preview .md-img img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  background: var(--bg);
}
.pensmith-preview .md-img img[data-asset-path]:not([src]) {
  display: block;
  min-height: 80px;
}
.pensmith-preview .md-img img[data-error] {
  outline: 1px dashed var(--err-soft);
}
.pensmith-preview .md-img__caption {
  margin-top: 6px;
  font-size: 10.5px;
  color: var(--ink-mute);
  font-style: italic;
}
.pensmith-preview .md-img.cover {
  margin: 0 0 12px;
}
.pensmith-preview .anchor {
  margin-left: 6px;
  font-size: 0.8em;
  opacity: 0.4;
  text-decoration: none;
}
`;
