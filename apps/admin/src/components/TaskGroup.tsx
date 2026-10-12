import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { Task } from '@vallista/content-core';
import { Input, Mono } from './atoms/Atoms';
import { TagSuggest, type TagSuggestHandle } from './TagSuggest';

export function GroupChip({ group, style }: { group: string; style?: CSSProperties }) {
  return (
    <Mono
      title={`구분: ${group}`}
      style={{
        fontSize: 10,
        color: 'var(--ink-soft)',
        background: 'var(--bg-shade)',
        padding: '1px 5px',
        borderRadius: 3,
        flexShrink: 0,
        maxWidth: 120,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        ...style,
      }}
    >
      {group}
    </Mono>
  );
}

interface GroupInputProps {
  value: string;
  onChange: (next: string) => void;
  suggestions: string[];
  placeholder?: string;
  sm?: boolean;
  autoFocus?: boolean;
  style?: CSSProperties;
}

export function GroupInput({
  value,
  onChange,
  suggestions,
  placeholder = '예: 테크부문',
  sm,
  autoFocus,
  style,
}: GroupInputProps) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const suggestRef = useRef<TagSuggestHandle | null>(null);
  const blurTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (blurTimerRef.current !== null) window.clearTimeout(blurTimerRef.current);
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', ...style }}>
      <Input
        ref={inputRef}
        sm={sm}
        autoFocus={autoFocus}
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setFocused(true);
        }}
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
            const trimmed = value.trim();
            if (trimmed !== value) onChange(trimmed);
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
            // 화살표·마우스로 고른 항목이 있을 때만 선택하고, 아니면 Enter를 부모(저장)에 넘긴다
            if (suggestRef.current?.pickActive()) {
              e.preventDefault();
              e.stopPropagation();
            }
          } else if (e.key === 'Escape') {
            if (focused && suggestRef.current?.hasMatches()) {
              e.preventDefault();
              e.stopPropagation();
              setFocused(false);
            }
          }
        }}
      />
      {focused && (
        <TagSuggest
          ref={suggestRef}
          query={value}
          allTags={suggestions}
          prefix=""
          initialActive={-1}
          showOnEmpty
          maxItems={8}
          onPick={(g) => {
            onChange(g);
            setFocused(false);
          }}
        />
      )}
    </div>
  );
}

export function collectGroups(tasks: readonly Task[]): string[] {
  const set = new Set<string>();
  for (const t of tasks) {
    const g = (t.group ?? '').trim();
    if (g) set.add(g);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'ko'));
}
