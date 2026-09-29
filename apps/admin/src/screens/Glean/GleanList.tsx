import { forwardRef, useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import type { GleanItem, GleanSource, GleanStatus } from '@vallista/content-core';
import { Mono } from '../../components/atoms/Atoms';
import type { StatusFilter } from './index';
import { AddDialog } from './AddDialog';
import { cleanThreadsText } from './ThreadsPostCard';

type Props = {
  items: GleanItem[];
  totalCount: number;
  filter: StatusFilter;
  onFilterChange: (f: StatusFilter) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdded: (item: GleanItem) => void;
  syncingLabel: string | null;
  onRefresh?: () => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
};

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'unread', label: '안 읽음' },
  { id: 'read', label: '읽음' },
  { id: 'archived', label: '보관' },
  { id: 'promoted', label: '담김' },
];

const STATUS_DOT: Record<GleanStatus, string> = {
  unread: 'var(--blue)',
  read: 'var(--ink-mute)',
  archived: 'var(--ink-faint)',
  promoted: 'var(--ok)',
};

const SOURCE_GLYPH: Record<GleanSource, string> = {
  web: '◐',
  rss: '⌬',
  youtube: '▷',
  paste: '▤',
  threads: '@',
};

export function GleanList({
  items,
  totalCount,
  filter,
  onFilterChange,
  selectedId,
  onSelect,
  onAdded,
  syncingLabel,
  onRefresh,
  hasMore,
  onLoadMore,
  isLoadingMore,
}: Props) {
  const [addOpen, setAddOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<GleanItem | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const stableLoadMore = useCallback(() => {
    if (hasMore && onLoadMore) onLoadMore();
  }, [hasMore, onLoadMore]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const obs = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting) stableLoadMore(); },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, stableLoadMore]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      if (items.length === 0) return;
      e.preventDefault();
      const idx = items.findIndex((i) => i.id === selectedId);
      let next = idx;
      if (e.key === 'ArrowDown') next = idx < 0 ? 0 : Math.min(items.length - 1, idx + 1);
      if (e.key === 'ArrowUp') next = idx < 0 ? items.length - 1 : Math.max(0, idx - 1);
      const picked = items[next];
      if (picked) onSelect(picked.id);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [items, selectedId, onSelect]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        borderRight: '1px solid var(--line)',
        background: 'var(--bg-soft)',
      }}
    >
      {syncingLabel && (
        <div
          style={{
            padding: '6px 12px',
            background: 'var(--blue)',
            color: '#fff',
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.04em',
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            flexShrink: 0,
          }}
        >
          <SyncSpinner />
          {syncingLabel} 동기화 중…
        </div>
      )}
      <div
        style={{
          padding: '10px 10px 8px',
          borderBottom: '1px solid var(--line)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)', letterSpacing: '0.06em' }}>
            줍기 · {totalCount}
          </Mono>
          <div style={{ display: 'flex', gap: 4 }}>
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={!!syncingLabel}
                title="새로고침 (구독 피드 동기화)"
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 4,
                  border: '1px solid var(--line)',
                  background: 'var(--bg)',
                  color: syncingLabel ? 'var(--ink-faint)' : 'var(--ink-soft)',
                  cursor: syncingLabel ? 'not-allowed' : 'pointer',
                  fontSize: 13,
                  lineHeight: 1,
                  fontFamily: 'inherit',
                  padding: 0,
                  transition: 'color 0.15s',
                }}
              >
                ↻
              </button>
            )}
            <button
              onClick={() => setAddOpen(true)}
              title="캡처 추가 (URL · 붙여넣기)"
              style={{
                width: 22,
                height: 22,
                borderRadius: 4,
                border: '1px solid var(--line)',
                background: 'var(--bg)',
                color: 'var(--ink-soft)',
                cursor: 'pointer',
                fontSize: 14,
                lineHeight: 1,
                fontFamily: 'inherit',
                padding: 0,
              }}
            >
              +
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {STATUS_FILTERS.map((f) => (
            <FilterChip key={f.id} active={filter === f.id} onClick={() => onFilterChange(f.id)}>
              {f.label}
            </FilterChip>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 4px 12px' }}>
        {items.length === 0 ? (
          <div
            style={{
              color: 'var(--ink-mute)',
              fontSize: 12,
              padding: '32px 16px',
              textAlign: 'center',
              fontStyle: 'italic',
            }}
          >
            {totalCount === 0 ? '비어있음' : '필터에 맞는 항목이 없습니다'}
          </div>
        ) : (
          items.map((it) => (
            <Row
              key={it.id}
              item={it}
              active={it.id === selectedId}
              onClick={() => onSelect(it.id)}
              onDigestClick={it.digest ? () => setPreviewItem(it) : undefined}
            />
          ))
        )}
        {hasMore && (
          <div
            ref={sentinelRef}
            style={{ height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {isLoadingMore && (
              <span style={{ fontSize: 10.5, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)' }}>
                로딩 중…
              </span>
            )}
          </div>
        )}
      </div>

      {addOpen && <AddDialog onClose={() => setAddOpen(false)} onAdded={onAdded} />}
      {previewItem?.digest && (
        <DigestModal item={previewItem} onClose={() => setPreviewItem(null)} />
      )}
    </div>
  );
}

function Row({ item, active, onClick, onDigestClick }: { item: GleanItem; active: boolean; onClick: () => void; onDigestClick?: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (active) ref.current?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const dot = STATUS_DOT[item.status] ?? 'var(--ink-mute)';
  const glyph = SOURCE_GLYPH[item.source] ?? '?';
  const time = formatRel(item.publishedAt ?? item.fetchedAt);

  if (item.source === 'threads') {
    return <ThreadsRow ref={ref} item={item} active={active} dot={dot} time={time} onClick={onClick} />;
  }

  return (
    <button
      ref={ref}
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 4,
        width: '100%',
        padding: '8px 10px',
        background: active ? 'var(--bg-shade)' : 'transparent',
        border: 'none',
        borderRadius: 5,
        color: active ? 'var(--ink)' : 'var(--ink-2)',
        fontFamily: 'inherit',
        fontSize: 12,
        cursor: 'pointer',
        textAlign: 'left',
        marginBottom: 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            background: dot,
            flex: '0 0 6px',
          }}
        />
        <span style={{ fontSize: 11, opacity: 0.85 }}>{glyph}</span>
        <span
          style={{
            flex: 1,
            minWidth: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontWeight: item.status === 'unread' ? 600 : 500,
          }}
        >
          {item.title || '(제목 없음)'}
        </span>
      </div>
      {item.digest ? (
        <div
          onClick={onDigestClick ? (e) => { e.stopPropagation(); onDigestClick(); } : undefined}
          style={{
            fontSize: 11,
            color: 'var(--ink-soft)',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            paddingLeft: 13,
            lineHeight: 1.4,
            whiteSpace: 'pre-wrap',
            cursor: onDigestClick ? 'pointer' : 'default',
          } as CSSProperties}
        >
          {item.digest}
        </div>
      ) : item.excerpt ? (
        <div
          style={{
            fontSize: 11,
            color: 'var(--ink-mute)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            paddingLeft: 13,
            lineHeight: 1.4,
          }}
        >
          {item.excerpt}
        </div>
      ) : null}
      <Mono style={{ fontSize: 9.5, color: 'var(--ink-faint)', paddingLeft: 13 }}>
        {hostname(item.url) || item.source} · {time}
        {item.digest ? ' · 요약' : ''}
      </Mono>
    </button>
  );
}

const ThreadsRow = forwardRef<
  HTMLButtonElement,
  { item: GleanItem; active: boolean; dot: string; time: string; onClick: () => void }
>(function ThreadsRow({ item, active, dot, time, onClick }, ref) {
  const { text, thumb } = parseThreadsPreview(item.body);
  const username = extractThreadsUsername(item.url) || item.title;

  return (
    <button
      ref={ref}
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 5,
        width: '100%',
        padding: '9px 10px',
        background: active ? 'var(--bg-shade)' : 'transparent',
        border: 'none',
        borderRadius: 5,
        color: active ? 'var(--ink)' : 'var(--ink-2)',
        fontFamily: 'inherit',
        fontSize: 12,
        cursor: 'pointer',
        textAlign: 'left',
        marginBottom: 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{ width: 6, height: 6, borderRadius: 999, background: dot, flex: '0 0 6px' }} />
        <span style={{ fontSize: 10.5, color: 'var(--ink-mute)' }}>◎</span>
        <span
          style={{
            flex: 1,
            minWidth: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontWeight: item.status === 'unread' ? 600 : 500,
            fontSize: 11.5,
          }}
        >
          {username || '(알 수 없음)'}
        </span>
        <Mono style={{ fontSize: 9, color: 'var(--ink-faint)' }}>{time}</Mono>
      </div>

      {(text || thumb) && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', paddingLeft: 13 }}>
          {text && (
            <div
              style={{
                flex: 1,
                minWidth: 0,
                fontSize: 11,
                color: 'var(--ink-soft)',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.45,
                whiteSpace: 'pre-wrap',
              }}
            >
              {text}
            </div>
          )}
          {thumb && (
            <img
              src={thumb}
              alt=""
              style={{
                width: 52,
                height: 52,
                borderRadius: 6,
                objectFit: 'cover',
                flex: '0 0 52px',
                background: 'var(--bg-shade)',
                border: '1px solid var(--line)',
              }}
            />
          )}
        </div>
      )}
    </button>
  );
});

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '3px 9px',
        borderRadius: 999,
        border: '1px solid transparent',
        background: active ? 'var(--ink)' : 'transparent',
        color: active ? 'var(--on-accent)' : 'var(--ink-soft)',
        fontSize: 10.5,
        fontFamily: 'inherit',
        cursor: 'pointer',
        lineHeight: 1.2,
      }}
    >
      {children}
    </button>
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

function parseThreadsPreview(body: string): { text: string; thumb: string | null } {
  if (!body) return { text: '', thumb: null };
  const lines = body.split('\n');
  let thumb: string | null = null;
  const textLines: string[] = [];
  for (const line of lines) {
    if (line.startsWith('[img]')) {
      if (!thumb) thumb = line.slice(5).trim();
    } else {
      textLines.push(line);
    }
  }
  const raw = textLines.join('\n').trim();
  return { text: cleanThreadsText(raw), thumb };
}

function extractThreadsUsername(url: string): string {
  if (!url) return '';
  try {
    const match = new URL(url).pathname.match(/^\/@?([^/]+)/);
    return match ? `@${match[1]}` : '';
  } catch {
    return '';
  }
}

function SyncSpinner() {
  return (
    <>
      <style>{`
        @keyframes glean-spin { to { transform: rotate(360deg); } }
      `}</style>
      <span
        style={{
          display: 'inline-block',
          width: 10,
          height: 10,
          borderRadius: 999,
          border: '1.5px solid rgba(255,255,255,0.35)',
          borderTopColor: '#fff',
          animation: 'glean-spin 0.7s linear infinite',
          flexShrink: 0,
        }}
      />
    </>
  );
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
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function DigestModal({ item, onClose }: { item: GleanItem; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const site = hostname(item.url) || item.source;
  const time = formatRel(item.publishedAt ?? item.fetchedAt);
  const lines = (item.digest ?? '').split('\n').filter(Boolean);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,18,22,0.46)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '10vh',
        zIndex: 220,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(520px, 92vw)',
          maxHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg)',
          borderRadius: 12,
          border: '1px solid var(--line)',
          boxShadow: '0 24px 56px rgba(0,0,0,0.28)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
            flexShrink: 0,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--ink)',
                marginBottom: 5,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {item.title || '(제목 없음)'}
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <Mono style={{ fontSize: 10, color: 'var(--ink-soft)' }}>{site}</Mono>
              <Mono style={{ fontSize: 10, color: 'var(--ink-faint)' }}>·</Mono>
              <Mono style={{ fontSize: 10, color: 'var(--ink-faint)' }}>{time}</Mono>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--ink-mute)',
              fontSize: 18,
              lineHeight: 1,
              padding: '0 2px',
              flexShrink: 0,
            }}
            aria-label="닫기"
          >
            ×
          </button>
        </div>
        <div style={{ padding: '16px 18px', overflowY: 'auto', flex: 1 }}>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {lines.map((line, i) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                  fontSize: 13,
                  color: 'var(--ink)',
                  lineHeight: 1.6,
                }}
              >
                <span style={{ color: 'var(--blue)', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>•</span>
                <span style={{ wordBreak: 'break-word' }}>{line.replace(/^[-•]\s*/, '')}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
