import { useState } from 'react';
import type { GleanItem } from '@vallista/content-core';
import { openUrl } from '../../lib/tauri';
import { Mono } from '../../components/atoms/Atoms';
import { ImageGrid } from './ThreadsPostCard';

type Props = {
  item: GleanItem;
};

export function RssArticleCard({ item }: Props) {
  const domain = extractDomain(item.url);
  const { text, images } = parseRssBody(item.body || item.excerpt || '');

  return (
    <div
      style={{
        background: 'var(--bg)',
        border: '1px solid var(--line)',
        borderRadius: 12,
        overflow: 'hidden',
        maxWidth: 600,
      }}
    >
      <div style={{ padding: '16px 18px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <FaviconIcon url={item.url} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span
              style={{
                fontSize: 13.5,
                fontWeight: 600,
                color: 'var(--ink)',
                letterSpacing: '-0.1px',
              }}
            >
              {domain || '(알 수 없음)'}
            </span>
            <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>
              {formatTime(item.fetchedAt)}
            </Mono>
          </div>
        </div>

        {item.title && (
          <p
            style={{
              margin: '0 0 10px',
              fontSize: 15,
              fontWeight: 600,
              lineHeight: 1.45,
              color: 'var(--ink)',
              letterSpacing: '-0.2px',
            }}
          >
            {item.title}
          </p>
        )}

        {text && (
          <p
            style={{
              margin: 0,
              fontSize: 13.5,
              lineHeight: 1.7,
              color: 'var(--ink-soft)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'keep-all',
              overflowWrap: 'break-word',
              maxHeight: 320,
              overflowY: 'auto',
            }}
          >
            {text}
          </p>
        )}
      </div>

      {images.length > 0 && <ImageGrid images={images} />}

      <div
        style={{
          padding: '10px 18px',
          borderTop: '1px solid var(--line)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <Mono style={{ fontSize: 10, color: 'var(--ink-faint)' }}>
          {item.url ? (
            <button
              onClick={() => openUrl(item.url)}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: 'inherit',
                fontFamily: 'inherit',
                fontSize: 'inherit',
                cursor: 'pointer',
              }}
            >
              {domain} →
            </button>
          ) : (
            'rss'
          )}
        </Mono>
      </div>
    </div>
  );
}

function FaviconIcon({ url }: { url: string }) {
  const [failed, setFailed] = useState(false);
  const faviconUrl = url ? `https://www.google.com/s2/favicons?sz=64&domain=${extractDomain(url)}` : '';

  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 8,
        background: 'var(--bg-shade)',
        border: '1px solid var(--line)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: '0 0 36px',
        overflow: 'hidden',
      }}
    >
      {faviconUrl && !failed ? (
        <img
          src={faviconUrl}
          alt=""
          width={20}
          height={20}
          style={{ display: 'block' }}
          onError={() => setFailed(true)}
        />
      ) : (
        <span style={{ fontSize: 15, color: 'var(--ink-mute)' }}>▣</span>
      )}
    </div>
  );
}

function parseRssBody(html: string): { text: string; images: string[] } {
  if (!html) return { text: '', images: [] };

  const images: string[] = [];
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = imgRegex.exec(html)) !== null) {
    if (m[1] && !m[1].startsWith('data:')) images.push(m[1]);
  }

  const text = html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return { text, images };
}

function extractDomain(url: string): string {
  if (!url) return '';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function formatTime(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '';
  const diff = Date.now() - t;
  const min = Math.floor(diff / 60_000);
  if (min < 60) return `${Math.max(1, min)}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  if (day < 30) return `${day}일 전`;
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
