import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

interface Props {
  value: number | null;
  onChange: (next: number | null) => void;
  placeholder?: string;
  title?: string;
  style?: CSSProperties;
}

const PRESETS: number[] = [
  5, 10, 15, 20, 25, 30, 45, 60, 90, 120, 150, 180, 240, 300, 360, 480,
];

export function EstSelect({
  value,
  onChange,
  placeholder = '직접 입력',
  title,
  style,
}: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string>(value != null ? estLabel(value) : '');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setDraft(value != null ? estLabel(value) : '');
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (e.target instanceof Node && wrapRef.current.contains(e.target)) return;
      commitDraft(draft);
      setOpen(false);
    };
    document.addEventListener('mousedown', onDoc, true);
    return () => document.removeEventListener('mousedown', onDoc, true);
  });

  const filtered = useMemo(() => filterPresets(PRESETS, draft), [draft]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const target = value != null && filtered.includes(value) ? value : filtered[0];
    if (target == null) return;
    const node = listRef.current.querySelector<HTMLButtonElement>(
      `[data-value="${target}"]`,
    );
    if (node) node.scrollIntoView({ block: 'nearest' });
  }, [open, filtered, value]);

  const commitDraft = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      if (value !== null) onChange(null);
      setDraft('');
      return;
    }
    const parsed = parseEstDraft(trimmed);
    if (parsed == null) {
      setDraft(value != null ? estLabel(value) : '');
      return;
    }
    if (parsed !== value) onChange(parsed);
    setDraft(estLabel(parsed));
  };

  const pickOption = (v: number) => {
    setDraft(estLabel(v));
    onChange(v);
    setOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative', ...style }}>
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={() => setOpen(true)}
        onMouseDown={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commitDraft(draft);
            setOpen(false);
            inputRef.current?.blur();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            setDraft(value != null ? estLabel(value) : '');
            setOpen(false);
            inputRef.current?.blur();
          } else if (e.key === 'ArrowDown' && filtered.length > 0) {
            e.preventDefault();
            const idx = value != null ? filtered.indexOf(value) : -1;
            const next = filtered[Math.min(idx + 1, filtered.length - 1)];
            if (next != null) pickOption(next);
          } else if (e.key === 'ArrowUp' && filtered.length > 0) {
            e.preventDefault();
            const idx = value != null ? filtered.indexOf(value) : -1;
            const next = filtered[Math.max(idx - 1, 0)];
            if (next != null) pickOption(next);
          }
        }}
        placeholder={placeholder}
        title={title ?? '예: 45, 90m, 1h30, 1:30'}
        style={{
          width: '100%',
          padding: '3px 8px',
          fontSize: 10.5,
          fontFamily: 'var(--font-mono)',
          fontVariantNumeric: 'tabular-nums',
          border: '1px dashed var(--line)',
          background: 'transparent',
          color: 'var(--ink)',
          borderRadius: 4,
          outline: 'none',
          boxSizing: 'border-box',
          cursor: 'pointer',
        }}
      />
      {open && filtered.length > 0 && (
        <div
          ref={listRef}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            background: 'var(--bg)',
            border: '1px solid var(--line-strong)',
            borderRadius: 6,
            padding: 4,
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            zIndex: 200,
            maxHeight: 220,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            minWidth: 100,
          }}
        >
          {filtered.map((opt) => {
            const sel = opt === value;
            return (
              <button
                key={opt}
                type="button"
                data-value={opt}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pickOption(opt);
                }}
                onMouseEnter={(e) => {
                  if (!sel)
                    (e.currentTarget as HTMLButtonElement).style.background =
                      'var(--bg-shade)';
                }}
                onMouseLeave={(e) => {
                  if (!sel)
                    (e.currentTarget as HTMLButtonElement).style.background =
                      'transparent';
                }}
                style={{
                  display: 'block',
                  textAlign: 'left',
                  padding: '5px 10px',
                  fontSize: 11.5,
                  fontFamily: 'var(--font-mono)',
                  fontVariantNumeric: 'tabular-nums',
                  border: 'none',
                  background: sel ? 'var(--ink)' : 'transparent',
                  color: sel ? 'var(--on-accent)' : 'var(--ink)',
                  borderRadius: 4,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {estLabel(opt)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function estLabel(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const r = min % 60;
  return r === 0 ? `${h}h` : `${h}h${r}m`;
}

function parseEstDraft(s: string): number | null {
  const t = s.trim().toLowerCase();
  if (!t) return null;
  const hm = /^(\d+)\s*h\s*(\d+)?\s*m?$/i.exec(t);
  if (hm && hm[1]) {
    const h = Number(hm[1]);
    const mi = hm[2] ? Number(hm[2]) : 0;
    const total = h * 60 + mi;
    return total > 0 ? total : null;
  }
  const colon = /^(\d+)\s*:\s*(\d+)$/.exec(t);
  if (colon && colon[1] && colon[2]) {
    const total = Number(colon[1]) * 60 + Number(colon[2]);
    return total > 0 ? total : null;
  }
  const numOnly = /^(\d+)\s*m?$/.exec(t);
  if (numOnly && numOnly[1]) {
    const n = Number(numOnly[1]);
    return n > 0 ? n : null;
  }
  return null;
}

function filterPresets(presets: number[], draft: string): number[] {
  const q = draft.trim().toLowerCase();
  if (!q) return presets;
  const parsed = parseEstDraft(q);
  if (parsed != null) {
    const exact = presets.includes(parsed) ? [parsed] : [];
    const near = presets.filter((p) => p !== parsed);
    return [...exact, ...near];
  }
  const digits = q.replace(/\D/g, '');
  if (!digits) return presets;
  const n = Number(digits);
  return presets
    .slice()
    .sort((a, b) => Math.abs(a - n) - Math.abs(b - n));
}
