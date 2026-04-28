import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { TagSuggest, type TagSuggestHandle } from './TagSuggest';
import { useAllTags } from '../lib/tags';

type Size = 'sm' | 'md';

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  extraSuggestions?: readonly string[];
  size?: Size;
  autoFocus?: boolean;
  onBlurCommit?: boolean;
  style?: CSSProperties;
}

export function TagInput({
  value,
  onChange,
  placeholder = '#태그 검색·추가',
  extraSuggestions,
  size = 'md',
  autoFocus,
  onBlurCommit = true,
  style,
}: Props) {
  const [draft, setDraft] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const suggestRef = useRef<TagSuggestHandle | null>(null);
  const blurTimerRef = useRef<number | null>(null);

  const baseTags = useAllTags();
  const allTags = useMemo(() => {
    if (!extraSuggestions || extraSuggestions.length === 0) return baseTags;
    const set = new Set(baseTags);
    for (const t of extraSuggestions) {
      const tag = (t ?? '').trim();
      if (tag) set.add(tag);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [baseTags, extraSuggestions]);

  useEffect(() => {
    return () => {
      if (blurTimerRef.current !== null) {
        window.clearTimeout(blurTimerRef.current);
      }
    };
  }, []);

  const commitDraft = (raw: string): boolean => {
    const parts = raw
      .split(',')
      .map((s) => s.replace(/^#/, '').trim())
      .filter(Boolean);
    if (parts.length === 0) return false;
    const next = [...value];
    let added = false;
    for (const p of parts) {
      if (!next.includes(p)) {
        next.push(p);
        added = true;
      }
    }
    if (added) onChange(next);
    setDraft('');
    return true;
  };

  const removeAt = (idx: number) => {
    const next = [...value];
    next.splice(idx, 1);
    onChange(next);
  };

  const dims = size === 'sm' ? SM_DIMS : MD_DIMS;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 4,
        width: '100%',
        ...style,
      }}
    >
      {value.map((t, i) => (
        <button
          key={`${t}-${i}`}
          type="button"
          onClick={() => removeAt(i)}
          title="제거"
          style={{
            padding: dims.chipPadding,
            fontSize: dims.fontSize,
            fontFamily: 'inherit',
            border: '1px solid var(--line)',
            background: 'var(--bg-shade)',
            color: 'var(--ink)',
            borderRadius: 999,
            cursor: 'pointer',
            lineHeight: 1.2,
          }}
        >
          #{t} ×
        </button>
      ))}
      <div style={{ position: 'relative', flex: 1, minWidth: 100 }}>
        <input
          ref={inputRef}
          autoFocus={autoFocus}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={() => {
            if (blurTimerRef.current !== null) {
              window.clearTimeout(blurTimerRef.current);
              blurTimerRef.current = null;
            }
            setFocused(true);
          }}
          onBlur={() => {
            blurTimerRef.current = window.setTimeout(() => {
              setFocused(false);
              if (onBlurCommit && draft.trim()) commitDraft(draft);
              blurTimerRef.current = null;
            }, 140);
          }}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return;
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              suggestRef.current?.next();
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              suggestRef.current?.prev();
            } else if (e.key === 'Enter') {
              e.preventDefault();
              const picked = suggestRef.current?.pickActive();
              if (!picked && draft.trim()) commitDraft(draft);
            } else if (e.key === ',') {
              e.preventDefault();
              if (draft.trim()) commitDraft(draft);
            } else if (e.key === 'Backspace' && !draft && value.length > 0) {
              e.preventDefault();
              removeAt(value.length - 1);
            } else if (e.key === 'Escape') {
              e.preventDefault();
              setFocused(false);
              inputRef.current?.blur();
            }
          }}
          placeholder={value.length === 0 ? placeholder : ''}
          style={{
            width: '100%',
            padding: dims.inputPadding,
            fontSize: dims.fontSize,
            border: '1px dashed var(--line)',
            background: 'transparent',
            color: 'var(--ink)',
            borderRadius: 4,
            fontFamily: 'inherit',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        {focused && (
          <TagSuggest
            ref={suggestRef}
            query={draft}
            allTags={allTags}
            exclude={value}
            showOnEmpty
            maxItems={8}
            onPick={(t) => {
              if (!value.includes(t)) onChange([...value, t]);
              setDraft('');
              inputRef.current?.focus();
            }}
          />
        )}
      </div>
    </div>
  );
}

const SM_DIMS = {
  fontSize: 10.5,
  chipPadding: '2px 7px',
  inputPadding: '3px 6px',
} as const;

const MD_DIMS = {
  fontSize: 12,
  chipPadding: '3px 9px',
  inputPadding: '6px 9px',
} as const;
