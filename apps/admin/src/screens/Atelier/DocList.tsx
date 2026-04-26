import { useEffect, useMemo, useState } from 'react';
import type { DocState, DocSummary } from '@vallista/content-core';
import { Mono } from '../../components/atoms/Atoms';
import type { StateFilter } from './LibraryRail';

type Props = {
  docs: DocSummary[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
  stateFilter: StateFilter;
  folder: string | null;
  tag: string | null;
};

const STATE_DOT: Record<DocState, string> = {
  seed: 'var(--ink-mute)',
  sprout: 'var(--blue)',
  draft: 'var(--warn)',
  published: 'var(--ok)',
};

const STATE_LABEL: Record<DocState, string> = {
  seed: '씨앗',
  sprout: '새싹',
  draft: '초고',
  published: '공개',
};

const STATE_COLOR: Record<DocState, string> = {
  seed: 'var(--blue)',
  sprout: 'var(--blue)',
  draft: 'var(--hl-amber)',
  published: 'var(--ok)',
};

export function DocList({
  docs,
  selectedPath,
  onSelect,
  stateFilter,
  folder,
  tag,
}: Props) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = docs.slice();
    out.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    if (stateFilter !== 'all') {
      out = out.filter((d) => d.state === stateFilter);
    }
    if (folder) {
      out = out.filter((d) => topSegment(d.path) === folder);
    }
    if (tag) {
      out = out.filter((d) => (d.tags ?? []).includes(tag));
    }
    if (q) {
      out = out.filter((d) => {
        const hay = `${d.title} ${d.slug ?? ''} ${d.tags.join(' ')}`.toLowerCase();
        return hay.includes(q);
      });
    }
    return out;
  }, [docs, query, stateFilter, folder, tag]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const tagName = target?.tagName;
      if (tagName === 'INPUT' || tagName === 'TEXTAREA' || target?.isContentEditable)
        return;
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      if (filtered.length === 0) return;
      e.preventDefault();
      const idx = filtered.findIndex((d) => d.path === selectedPath);
      let next = idx;
      if (e.key === 'ArrowDown')
        next = idx < 0 ? 0 : Math.min(filtered.length - 1, idx + 1);
      if (e.key === 'ArrowUp')
        next = idx < 0 ? filtered.length - 1 : Math.max(0, idx - 1);
      const picked = filtered[next];
      if (picked) onSelect(picked.path);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [filtered, selectedPath, onSelect]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        borderRight: '1px solid var(--line)',
        background: 'var(--bg)',
      }}
    >
      <div
        style={{
          padding: '12px 14px',
          borderBottom: '1px solid var(--line)',
          background: 'var(--bg-soft)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="문서 검색…"
          style={{
            flex: 1,
            padding: '6px 10px',
            borderRadius: 6,
            border: '1px solid var(--line)',
            background: 'var(--bg-input)',
            color: 'var(--ink)',
            fontSize: 12,
            fontFamily: 'inherit',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>
      <div
        style={{
          padding: '8px 14px 6px',
          borderBottom: '1px solid var(--line-subtle)',
          background: 'var(--bg-soft)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)' }}>
          {filtered.length}개
        </Mono>
        <span style={{ flex: 1 }} />
        <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)' }}>최근 ↓</Mono>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div
            style={{
              color: 'var(--ink-mute)',
              fontSize: 12,
              padding: '32px 16px',
              textAlign: 'center',
              fontStyle: 'italic',
            }}
          >
            맞는 문서가 없습니다
          </div>
        ) : (
          filtered.map((d) => (
            <DocRow
              key={d.path}
              doc={d}
              active={d.path === selectedPath}
              onClick={() => onSelect(d.path)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function DocRow({
  doc,
  active,
  onClick,
}: {
  doc: DocSummary;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        width: '100%',
        padding: '12px 16px',
        background: active ? 'var(--bg-shade)' : 'transparent',
        borderLeft: `2px solid ${active ? 'var(--blue)' : 'transparent'}`,
        border: 'none',
        borderBottom: '1px solid var(--line-subtle)',
        textAlign: 'left',
        cursor: 'pointer',
        fontFamily: 'inherit',
        color: 'var(--ink)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            background: STATE_DOT[doc.state] ?? 'var(--ink-mute)',
            flex: '0 0 6px',
          }}
        />
        <span
          style={{
            flex: 1,
            fontSize: 13,
            fontWeight: 500,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: 'var(--ink)',
          }}
        >
          {doc.title || doc.slug || doc.path}
        </span>
        <StatePill state={doc.state} />
      </div>
      {doc.excerpt && (
        <div
          style={{
            fontSize: 11.5,
            color: 'var(--ink-soft)',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {doc.excerpt}
        </div>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginTop: 2,
        }}
      >
        <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>
          {formatRel(doc.updatedAt)}
        </Mono>
        <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>
          · {doc.words}자
        </Mono>
        <span style={{ flex: 1 }} />
        {doc.tags.slice(0, 2).map((t) => (
          <Mono
            key={t}
            style={{
              fontSize: 9.5,
              color: 'var(--ink-mute)',
              padding: '1px 5px',
              border: '1px solid var(--line)',
              borderRadius: 999,
              background: 'var(--bg)',
            }}
          >
            {t}
          </Mono>
        ))}
      </div>
    </button>
  );
}

function StatePill({ state }: { state: DocState }) {
  const c = STATE_COLOR[state];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '1px 6px',
        borderRadius: 999,
        fontFamily: 'var(--font-mono)',
        fontSize: 9,
        fontWeight: 600,
        color: c,
        background: 'transparent',
        border: '1px solid currentColor',
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      {STATE_LABEL[state]}
    </span>
  );
}

function topSegment(p: string): string | null {
  const parts = p.split('/').filter(Boolean);
  if (parts.length < 2) return null;
  return parts[1] ?? null;
}

function formatRel(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '';
  const diff = Date.now() - t;
  const min = Math.floor(diff / 60_000);
  if (min < 1) return '방금';
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  if (day < 30) return `${day}일 전`;
  const d = new Date(t);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
