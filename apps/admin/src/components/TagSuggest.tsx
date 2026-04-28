import { useEffect, useImperativeHandle, useMemo, useRef, useState, forwardRef } from 'react';

interface Props {
  query: string;
  allTags: string[];
  exclude?: readonly string[];
  onPick: (tag: string) => void;
  maxItems?: number;
  showOnEmpty?: boolean;
  style?: React.CSSProperties;
}

export interface TagSuggestHandle {
  next: () => void;
  prev: () => void;
  pickActive: () => string | null;
  hasMatches: () => boolean;
}

export const TagSuggest = forwardRef<TagSuggestHandle, Props>(function TagSuggest(
  { query, allTags, exclude = [], onPick, maxItems = 6, showOnEmpty = false, style },
  ref,
) {
  const matches = useMemo(() => {
    const q = query.trim().replace(/^#/, '').toLowerCase();
    const ex = new Set(exclude);
    if (!q) {
      if (!showOnEmpty) return [];
      const out: string[] = [];
      for (const t of allTags) {
        if (ex.has(t)) continue;
        out.push(t);
        if (out.length >= maxItems) break;
      }
      return out;
    }
    const pre: string[] = [];
    const sub: string[] = [];
    for (const t of allTags) {
      if (ex.has(t)) continue;
      const lower = t.toLowerCase();
      if (lower === q) continue;
      if (lower.startsWith(q)) pre.push(t);
      else if (lower.includes(q)) sub.push(t);
    }
    return [...pre, ...sub].slice(0, maxItems);
  }, [query, allTags, exclude, maxItems, showOnEmpty]);

  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setActive(0);
  }, [query, matches.length]);

  useEffect(() => {
    if (!listRef.current) return;
    const node = listRef.current.querySelector<HTMLButtonElement>(
      `[data-idx="${active}"]`,
    );
    if (node) node.scrollIntoView({ block: 'nearest' });
  }, [active]);

  useImperativeHandle(
    ref,
    () => ({
      next: () => {
        if (matches.length === 0) return;
        setActive((i) => Math.min(i + 1, matches.length - 1));
      },
      prev: () => {
        if (matches.length === 0) return;
        setActive((i) => Math.max(i - 1, 0));
      },
      pickActive: () => {
        const t = matches[active];
        if (!t) return null;
        onPick(t);
        return t;
      },
      hasMatches: () => matches.length > 0,
    }),
    [matches, active, onPick],
  );

  if (matches.length === 0) return null;

  return (
    <div
      ref={listRef}
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        marginTop: 4,
        background: 'var(--bg)',
        border: '1px solid var(--line-strong)',
        borderRadius: 6,
        padding: 4,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
        zIndex: 50,
        minWidth: 140,
        maxWidth: 240,
        maxHeight: 220,
        overflowY: 'auto',
        ...style,
      }}
    >
      {matches.map((t, idx) => {
        const sel = idx === active;
        return (
          <button
            key={t}
            type="button"
            data-idx={idx}
            onMouseDown={(e) => {
              e.preventDefault();
              onPick(t);
            }}
            onMouseEnter={() => setActive(idx)}
            style={{
              display: 'block',
              textAlign: 'left',
              padding: '4px 8px',
              fontSize: 11.5,
              fontFamily: 'inherit',
              border: 'none',
              background: sel ? 'var(--bg-shade)' : 'transparent',
              color: 'var(--ink)',
              borderRadius: 4,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            #{t}
          </button>
        );
      })}
    </div>
  );
});
