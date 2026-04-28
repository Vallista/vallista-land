import { useEffect, useMemo, useRef, useState } from 'react';
import { renderMarkdown, resolveAssetPath } from '@vallista/markdown';
import '@vallista/markdown/prose.css';
import { loadAssetUrl } from '../../lib/assetCache';
import { useDoc } from './state';

export function PreviewPanel() {
  const { body, frontmatter, path } = useDoc();
  const { html } = useMemo(() => renderMarkdown(body, { docPath: path }), [body, path]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const title = strOr(frontmatter.title, '');
  const coverImage = strOr(frontmatter.image, '');
  const coverResolved = coverImage ? resolveAssetPath(path, coverImage) : null;

  const [splashUrl, setSplashUrl] = useState<string | null>(null);
  const [splashError, setSplashError] = useState(false);

  useEffect(() => {
    setSplashUrl(null);
    setSplashError(false);
    if (!coverImage) return;
    if (/^(https?:)?\/\//i.test(coverImage) || coverImage.startsWith('data:')) {
      setSplashUrl(coverImage);
      return;
    }
    if (!coverResolved) return;
    let alive = true;
    loadAssetUrl(coverResolved).then(
      (url) => {
        if (alive) setSplashUrl(url);
      },
      () => {
        if (alive) setSplashError(true);
      },
    );
    return () => {
      alive = false;
    };
  }, [coverImage, coverResolved]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const imgs = Array.from(root.querySelectorAll<HTMLImageElement>('img[data-asset-path]'));
    let alive = true;
    imgs.forEach((img) => {
      if (img.dataset.loaded === '1') return;
      const ap = img.getAttribute('data-asset-path');
      if (!ap) return;
      loadAssetUrl(ap).then(
        (url) => {
          if (!alive) return;
          img.src = url;
          img.dataset.loaded = '1';
          const card = img.closest('.img-card');
          if (card) card.classList.add('is-loaded');
        },
        () => {
          if (!alive) return;
          img.dataset.error = '1';
          const card = img.closest('.img-card');
          if (card) card.classList.add('is-error');
        },
      );
    });
    return () => {
      alive = false;
    };
  }, [html]);

  return (
    <div
      ref={containerRef}
      className="preview-scroll"
      style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}
    >
      <style>{previewCss}</style>
      <article className="preview">
        {coverResolved && (
          <figure className={`preview__splash${splashError ? ' is-error' : ''}`}>
            {splashUrl && <img src={splashUrl} alt={title} loading="lazy" />}
          </figure>
        )}
        <div className="preview__prose" dangerouslySetInnerHTML={{ __html: html }} />
      </article>
    </div>
  );
}

function strOr(v: unknown, fallback: string): string {
  if (typeof v === 'string') return v;
  return fallback;
}

const previewCss = `
.preview-scroll {
  /* 블로그 라이트 팔레트로 토큰 재정의 — 다크 admin 안에서도 실제 배포 블로그와 동일한 톤 */
  --bg: #ffffff;
  --bg-soft: #fafbfc;
  --bg-shade: #f1f2f6;
  --bg-elev: #ffffff;
  --ink: #0b1220;
  --ink-2: #3a4255;
  --ink-soft: #6b7389;
  --ink-mute: #9aa1b4;
  --ink-faint: #b8bdc9;
  --line: #e6e8ee;
  --line-strong: #d2d6df;
  --line-subtle: #f1f2f6;
  --accent: #0b1220;
  --accent-ring: rgba(11, 18, 32, 0.14);
  --blue: #2b6cff;
  --blue-soft: rgba(43, 108, 255, 0.08);
  --err: #b91c1c;
  --err-soft: rgba(185, 28, 28, 0.08);
  --ok: #2a7f3f;
  --warn: #8a6628;
  --radius-sm: 4px;
  --radius: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  color-scheme: light;
  background: #ffffff;
  color: var(--ink);
  padding: 48px 56px 96px;
}

.preview {
  max-width: 680px;
  margin: 0 auto;
  color: var(--ink);
  font-family: var(--font-serif);
}

.preview__splash {
  margin: 0 0 32px;
  border-radius: 10px;
  overflow: hidden;
  background: var(--bg-shade);
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.preview__splash img {
  display: block;
  width: 100%;
  height: auto;
  max-height: 480px;
  object-fit: cover;
}
.preview__splash.is-error {
  outline: 1px dashed var(--line-strong);
}
.preview__splash.is-error::after {
  content: "커버 이미지를 불러올 수 없습니다";
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--ink-mute);
}
`;
