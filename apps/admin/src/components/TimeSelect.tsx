import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

interface Props {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  step?: number;
  disabled?: boolean;
  title?: string;
  style?: CSSProperties;
}

export function TimeSelect({
  value,
  onChange,
  placeholder = '--:--',
  step = 15,
  disabled,
  title,
  style,
}: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string>(value);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (e.target instanceof Node && wrapRef.current.contains(e.target)) return;
      commit(draft);
      setOpen(false);
    };
    document.addEventListener('mousedown', onDoc, true);
    return () => document.removeEventListener('mousedown', onDoc, true);
  });

  const options = useMemo(() => buildOptions(step), [step]);
  const filtered = useMemo(() => filterOptions(options, draft), [options, draft]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const target = value && filtered.includes(value) ? value : filtered[0];
    if (!target) return;
    const node = listRef.current.querySelector<HTMLButtonElement>(
      `[data-value="${target}"]`,
    );
    if (node) node.scrollIntoView({ block: 'nearest' });
  }, [open, filtered, value]);

  const commit = (raw: string) => {
    const norm = normalize(raw);
    if (norm === null) {
      setDraft(value);
      return;
    }
    if (norm !== value) onChange(norm);
    setDraft(norm);
  };

  const pickOption = (v: string) => {
    setDraft(v);
    onChange(v);
    setOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div
      ref={wrapRef}
      style={{ position: 'relative', ...style }}
    >
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={() => !disabled && setOpen(true)}
        onMouseDown={() => !disabled && setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit(draft);
            setOpen(false);
            inputRef.current?.blur();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            setDraft(value);
            setOpen(false);
            inputRef.current?.blur();
          } else if (e.key === 'ArrowDown' && filtered.length > 0) {
            e.preventDefault();
            const idx = filtered.indexOf(value);
            const next = filtered[Math.min(idx + 1, filtered.length - 1)];
            if (next) pickOption(next);
          } else if (e.key === 'ArrowUp' && filtered.length > 0) {
            e.preventDefault();
            const idx = filtered.indexOf(value);
            const next = filtered[Math.max(idx - 1, 0)];
            if (next) pickOption(next);
          }
        }}
        placeholder={placeholder}
        title={title}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '6px 8px',
          fontSize: 12,
          fontFamily: 'var(--font-mono)',
          fontVariantNumeric: 'tabular-nums',
          border: `1px ${value === '' ? 'dashed' : 'solid'} var(--line)`,
          background: disabled ? 'var(--bg-shade)' : 'var(--bg)',
          color: value === '' ? 'var(--ink-mute)' : 'var(--ink)',
          borderRadius: 5,
          outline: 'none',
          boxSizing: 'border-box',
          cursor: disabled ? 'not-allowed' : 'pointer',
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
                  if (!sel) (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-shade)';
                }}
                onMouseLeave={(e) => {
                  if (!sel) (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
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
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function buildOptions(step: number): string[] {
  const out: string[] = [];
  const safe = Math.max(1, Math.min(step, 60));
  for (let m = 0; m < 24 * 60; m += safe) {
    const h = Math.floor(m / 60);
    const mi = m % 60;
    out.push(`${pad(h)}:${pad(mi)}`);
  }
  return out;
}

function filterOptions(opts: string[], draft: string): string[] {
  const q = draft.trim();
  if (!q) return opts;
  const digits = q.replace(/\D/g, '');
  if (digits.length === 0) return opts;
  return opts.filter((o) => o.replace(/\D/g, '').startsWith(digits));
}

function normalize(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 0) return null;
  let h: number;
  let m: number;
  if (digits.length <= 2) {
    h = Number(digits);
    m = 0;
  } else if (digits.length === 3) {
    h = Number(digits.slice(0, 1));
    m = Number(digits.slice(1));
  } else {
    h = Number(digits.slice(0, 2));
    m = Number(digits.slice(2, 4));
  }
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  if (h > 23 || m > 59) return null;
  return `${pad(h)}:${pad(m)}`;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
