import { useEffect, useRef, useState } from 'react';
import type { DocState } from '@vallista/content-core';
import { Mono } from '../../components/atoms/Atoms';
import { useDoc } from './state';

type Collection = 'articles' | 'notes';

const STATE_OPTIONS: { value: DocState; label: string }[] = [
  { value: 'seed', label: '씨앗' },
  { value: 'sprout', label: '새싹' },
  { value: 'draft', label: '초안' },
  { value: 'published', label: '공개' },
];

export function MetaPanel({ collection }: { collection: Collection }) {
  const { frontmatter, setFrontmatter } = useDoc();

  const setKey = (key: string, value: unknown) => {
    const next = { ...frontmatter };
    if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
      delete next[key];
    } else {
      next[key] = value;
    }
    setFrontmatter(next);
  };

  const title = strOr(frontmatter.title, '');
  const slug = strOr(frontmatter.slug, '');
  const dek = strOr(frontmatter.dek ?? frontmatter.description, '');
  const image = strOr(frontmatter.image, '');
  const state = stateOr(frontmatter.state);
  const dateLocal = dateToLocalInput(frontmatter.date);
  const featured = frontmatter.featured === true;

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px 24px' }}>
      <Field label="TITLE">
        <input
          value={title}
          onChange={(e) => setKey('title', e.target.value)}
          style={inputStyle}
          placeholder="제목"
        />
      </Field>

      <Field label="SLUG">
        <input
          value={slug}
          onChange={(e) => setKey('slug', e.target.value)}
          style={{ ...inputStyle, fontFamily: 'var(--font-mono)', fontSize: 11.5 }}
          placeholder="kebab-case"
          spellCheck={false}
        />
      </Field>

      <Field label="DATE">
        <input
          type="datetime-local"
          value={dateLocal}
          onChange={(e) => {
            const iso = localInputToISO(e.target.value);
            setKey('date', iso);
          }}
          style={{ ...inputStyle, fontFamily: 'var(--font-mono)', fontSize: 11.5 }}
        />
      </Field>

      <Field label="STATE">
        <select
          value={state ?? ''}
          onChange={(e) => {
            const v = e.target.value;
            setKey('state', v === '' ? undefined : (v as DocState));
          }}
          style={{ ...inputStyle, cursor: 'pointer' }}
        >
          <option value="">(미지정)</option>
          {STATE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label} · {o.value}
            </option>
          ))}
        </select>
      </Field>

      <Field label="TAGS">
        <TagsField />
      </Field>

      {collection === 'articles' && (
        <Field label="DEK">
          <textarea
            value={dek}
            onChange={(e) => {
              setKey('dek', e.target.value);
              if (typeof frontmatter.description === 'string') {
                setKey('description', e.target.value);
              }
            }}
            rows={2}
            style={{ ...inputStyle, resize: 'vertical', minHeight: 50, lineHeight: 1.5 }}
            placeholder="부제 / 한 줄 요약"
          />
        </Field>
      )}

      {collection === 'articles' && (
        <Field
          label="SERIES"
          hint={isObjectSeries(frontmatter.series) ? '객체 형태 — name 만 편집됩니다' : undefined}
        >
          <SeriesField />
        </Field>
      )}

      <Field label="IMAGE" hint="문서 폴더 기준 상대 경로 (./assets/cover.jpg)">
        <input
          value={image}
          onChange={(e) => setKey('image', e.target.value)}
          style={{ ...inputStyle, fontFamily: 'var(--font-mono)', fontSize: 11.5 }}
          placeholder="./assets/…"
          spellCheck={false}
        />
      </Field>

      {collection === 'articles' && (
        <Field label="FEATURED">
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12,
              color: 'var(--ink)',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setKey('featured', e.target.checked || undefined)}
              style={{ cursor: 'pointer' }}
            />
            홈 상단 노출
          </label>
        </Field>
      )}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <Mono
        style={{
          display: 'block',
          fontSize: 9.5,
          color: 'var(--ink-mute)',
          letterSpacing: '0.08em',
          marginBottom: 5,
        }}
      >
        {label}
      </Mono>
      {children}
      {hint && (
        <Mono style={{ display: 'block', marginTop: 4, fontSize: 9.5, color: 'var(--ink-faint)' }}>
          {hint}
        </Mono>
      )}
    </div>
  );
}

function TagsField() {
  const { frontmatter, setFrontmatter } = useDoc();
  const tags = tagsAsArray(frontmatter.tags);
  const initial = tags.join(', ');
  const [text, setText] = useState(initial);
  const lastTagsRef = useRef<string>(initial);

  useEffect(() => {
    const next = tags.join(', ');
    if (next !== lastTagsRef.current) {
      setText(next);
      lastTagsRef.current = next;
    }
  }, [tags]);

  const commit = () => {
    const parsed = text
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const next = { ...frontmatter };
    if (parsed.length === 0) {
      delete next.tags;
    } else {
      next.tags = parsed;
    }
    setFrontmatter(next);
    lastTagsRef.current = parsed.join(', ');
  };

  return (
    <input
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          commit();
          (e.target as HTMLInputElement).blur();
        }
      }}
      style={inputStyle}
      placeholder="쉼표로 구분"
    />
  );
}

function SeriesField() {
  const { frontmatter, setFrontmatter } = useDoc();
  const value = seriesAsString(frontmatter.series);

  const onChange = (raw: string) => {
    const trimmed = raw.trim();
    const next = { ...frontmatter };
    if (!trimmed) {
      delete next.series;
    } else if (isObjectSeries(frontmatter.series)) {
      next.series = { ...(frontmatter.series as object), name: trimmed };
    } else {
      next.series = trimmed;
    }
    setFrontmatter(next);
  };

  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={inputStyle}
      placeholder="시리즈 이름"
    />
  );
}

const inputStyle: React.CSSProperties = {
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
};

function strOr(v: unknown, fallback: string): string {
  if (typeof v === 'string') return v;
  return fallback;
}

function stateOr(v: unknown): DocState | undefined {
  if (v === 'seed' || v === 'sprout' || v === 'draft' || v === 'published') return v;
  return undefined;
}

function tagsAsArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String).filter((s) => s.trim().length > 0);
  if (typeof v === 'string' && v.trim().length > 0) return [v];
  return [];
}

function dateToLocalInput(v: unknown): string {
  let d: Date | null = null;
  if (v instanceof Date) d = v;
  else if (typeof v === 'string' && v.length > 0) d = new Date(v);
  if (!d || isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localInputToISO(s: string): string | undefined {
  if (!s) return undefined;
  const d = new Date(s);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

function isObjectSeries(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function seriesAsString(v: unknown): string {
  if (typeof v === 'string') return v;
  if (isObjectSeries(v)) {
    const name = v.name;
    if (typeof name === 'string') return name;
  }
  return '';
}
