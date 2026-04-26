import { useEffect, useMemo, useState } from 'react';
import type { DocState, DocSummary } from '@vallista/content-core';
import { Mono } from '../../components/atoms/Atoms';

type Props = {
  docs: DocSummary[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
};

type StateFilter = DocState | 'all';

const STATE_FILTERS: { id: StateFilter; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'seed', label: '씨앗' },
  { id: 'sprout', label: '새싹' },
  { id: 'draft', label: '초안' },
  { id: 'published', label: '공개' },
];

const STATE_DOT: Record<DocState, string> = {
  seed: 'var(--ink-mute)',
  sprout: 'var(--blue)',
  draft: 'var(--warn)',
  published: 'var(--ok)',
};

export function DocList({ docs, selectedPath, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [stateFilter, setStateFilter] = useState<StateFilter>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = docs.slice();
    out.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    if (stateFilter !== 'all') {
      out = out.filter((d) => d.state === stateFilter);
    }
    if (q) {
      out = out.filter((d) => {
        const hay = `${d.title} ${d.slug ?? ''} ${d.tags.join(' ')}`.toLowerCase();
        return hay.includes(q);
      });
    }
    return out;
  }, [docs, query, stateFilter]);

  const articles = filtered.filter((d) => d.collection === 'articles');
  const notes = filtered.filter((d) => d.collection === 'notes');

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      if (filtered.length === 0) return;
      e.preventDefault();
      const idx = filtered.findIndex((d) => d.path === selectedPath);
      let next = idx;
      if (e.key === 'ArrowDown') next = idx < 0 ? 0 : Math.min(filtered.length - 1, idx + 1);
      if (e.key === 'ArrowUp') next = idx < 0 ? filtered.length - 1 : Math.max(0, idx - 1);
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
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="제목 · slug · 태그"
          style={{
            width: '100%',
            padding: '6px 9px',
            background: 'var(--bg)',
            border: '1px solid var(--line)',
            borderRadius: 5,
            color: 'var(--ink)',
            fontSize: 12,
            fontFamily: 'inherit',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {STATE_FILTERS.map((f) => (
            <FilterChip
              key={f.id}
              active={stateFilter === f.id}
              onClick={() => setStateFilter(f.id)}
            >
              {f.label}
            </FilterChip>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 4px 12px' }}>
        {filtered.length === 0 && (
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
        )}
        <Group label={`긴 글 · ${articles.length}`} items={articles} selectedPath={selectedPath} onSelect={onSelect} />
        <Group label={`짧은 글 · ${notes.length}`} items={notes} selectedPath={selectedPath} onSelect={onSelect} />
      </div>
    </div>
  );
}

function Group({
  label,
  items,
  selectedPath,
  onSelect,
}: {
  label: string;
  items: DocSummary[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <div
        style={{
          padding: '12px 10px 4px',
          fontSize: 9.5,
          fontWeight: 600,
          color: 'var(--ink-mute)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          fontFamily: 'var(--font-mono)',
        }}
      >
        {label}
      </div>
      {items.map((d) => (
        <Row key={d.path} doc={d} active={d.path === selectedPath} onClick={() => onSelect(d.path)} />
      ))}
    </div>
  );
}

function Row({ doc, active, onClick }: { doc: DocSummary; active: boolean; onClick: () => void }) {
  const dot = STATE_DOT[doc.state] ?? 'var(--ink-mute)';
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        padding: '6px 8px',
        background: active ? 'var(--bg-shade)' : 'transparent',
        border: 'none',
        borderRadius: 4,
        color: active ? 'var(--ink)' : 'var(--ink-2)',
        fontFamily: 'inherit',
        fontSize: 12,
        cursor: 'pointer',
        textAlign: 'left',
        marginBottom: 1,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: dot,
          flex: '0 0 6px',
        }}
      />
      <span
        style={{
          flex: 1,
          minWidth: 0,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {doc.title || doc.slug || doc.path}
      </span>
      <Mono style={{ fontSize: 9.5, color: 'var(--ink-mute)' }}>{doc.words}</Mono>
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
