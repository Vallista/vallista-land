import type { GleanItem, GleanSource, GleanStatus } from '@vallista/content-core';
import { Mono } from '../../components/atoms/Atoms';

const SOURCE_GLYPH: Record<GleanSource, string> = {
  web: '🌐',
  rss: '📰',
  youtube: '▶',
  paste: '✎',
};

const STATUS_DOT: Record<GleanStatus, string> = {
  unread: 'var(--blue)',
  read: 'var(--ink-mute)',
  archived: 'var(--ink-faint)',
  promoted: 'var(--ok)',
};

type Props = {
  items: GleanItem[];
  loading: boolean;
};

export function RecentGlean({ items, loading }: Props) {
  if (loading) {
    return (
      <div
        style={{
          padding: '20px 0',
          color: 'var(--ink-faint)',
          fontSize: 12,
          fontFamily: 'var(--font-mono)',
        }}
      >
        읽는 중…
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div
        style={{
          padding: '24px 0',
          color: 'var(--ink-mute)',
          fontSize: 13,
          fontStyle: 'italic',
          textAlign: 'center',
        }}
      >
        최근 캡처가 없습니다
      </div>
    );
  }
  return (
    <div>
      {items.map((it) => (
        <Row key={it.id} item={it} />
      ))}
    </div>
  );
}

function Row({ item }: { item: GleanItem }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '7px 4px',
        borderBottom: '1px solid var(--line)',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: STATUS_DOT[item.status],
          flex: '0 0 6px',
        }}
      />
      <span style={{ fontSize: 11, opacity: 0.85, flex: '0 0 auto' }}>
        {SOURCE_GLYPH[item.source]}
      </span>
      <span
        style={{
          flex: 1,
          minWidth: 0,
          color: 'var(--ink)',
          fontSize: 13.5,
          fontWeight: item.status === 'unread' ? 600 : 500,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {item.title || '(제목 없음)'}
      </span>
      <Mono style={{ fontSize: 10, color: 'var(--ink-faint)' }}>
        {hostname(item.url) || item.source} · {formatRel(item.fetchedAt)}
      </Mono>
    </div>
  );
}

function hostname(url: string): string {
  if (!url) return '';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function formatRel(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '';
  const diff = Date.now() - t;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return '방금';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  if (day < 30) return `${day}일 전`;
  const d = new Date(t);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
