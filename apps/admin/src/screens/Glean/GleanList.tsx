import { useEffect, useState } from 'react';
import type { GleanItem, GleanSource, GleanStatus } from '@vallista/content-core';
import { Mono } from '../../components/atoms/Atoms';
import type { StatusFilter } from './index';
import { AddDialog } from './AddDialog';

type Props = {
  items: GleanItem[];
  totalCount: number;
  filter: StatusFilter;
  onFilterChange: (f: StatusFilter) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdded: (item: GleanItem) => void;
};

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'unread', label: '안 읽음' },
  { id: 'read', label: '읽음' },
  { id: 'archived', label: '보관' },
  { id: 'promoted', label: '씨앗' },
];

const STATUS_DOT: Record<GleanStatus, string> = {
  unread: 'var(--blue)',
  read: 'var(--ink-mute)',
  archived: 'var(--ink-faint)',
  promoted: 'var(--ok)',
};

const SOURCE_GLYPH: Record<GleanSource, string> = {
  web: '🌐',
  rss: '📰',
  youtube: '▶',
  paste: '✎',
};

export function GleanList({
  items,
  totalCount,
  filter,
  onFilterChange,
  selectedId,
  onSelect,
  onAdded,
}: Props) {
  const [addOpen, setAddOpen] = useState(false);

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
            />
          ))
        )}
      </div>

      {addOpen && <AddDialog onClose={() => setAddOpen(false)} onAdded={onAdded} />}
    </div>
  );
}

function Row({ item, active, onClick }: { item: GleanItem; active: boolean; onClick: () => void }) {
  const dot = STATUS_DOT[item.status] ?? 'var(--ink-mute)';
  const glyph = SOURCE_GLYPH[item.source] ?? '?';
  const time = formatRel(item.fetchedAt);
  return (
    <button
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
      {item.excerpt && (
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
      )}
      <Mono style={{ fontSize: 9.5, color: 'var(--ink-faint)', paddingLeft: 13 }}>
        {hostname(item.url) || item.source} · {time}
      </Mono>
    </button>
  );
}

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
