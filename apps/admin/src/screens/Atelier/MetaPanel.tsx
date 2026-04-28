import type { DocState } from '@vallista/content-core';
import { Checkbox, Input, Mono, Select, Textarea, type SelectOption } from '../../components/atoms/Atoms';
import { TagInput } from '../../components/TagInput';
import { useDoc } from './state';

type Collection = 'articles' | 'notes';

const STATE_OPTIONS: SelectOption<DocState>[] = [
  { value: 'seed', label: '메모', hint: 'seed', dot: 'var(--ink-mute)' },
  { value: 'sprout', label: '초안', hint: 'sprout', dot: 'var(--blue)' },
  { value: 'draft', label: '교정', hint: 'draft', dot: 'var(--warn)' },
  { value: 'published', label: '공개', hint: 'published', dot: 'var(--ok)' },
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
        <Input
          sm
          value={title}
          onChange={(e) => setKey('title', e.target.value)}
          placeholder="제목"
        />
      </Field>

      <Field label="SLUG">
        <Input
          sm
          mono
          value={slug}
          onChange={(e) => setKey('slug', e.target.value)}
          style={{ fontSize: 11.5 }}
          placeholder="kebab-case"
          spellCheck={false}
        />
      </Field>

      <Field label="DATE">
        <Input
          sm
          mono
          type="datetime-local"
          value={dateLocal}
          onChange={(e) => {
            const iso = localInputToISO(e.target.value);
            setKey('date', iso);
          }}
          style={{ fontSize: 11.5 }}
        />
      </Field>

      <Field label="STATE">
        <Select<DocState>
          value={state ?? null}
          options={STATE_OPTIONS}
          placeholder="(미지정)"
          onChange={(v) => setKey('state', v)}
        />
      </Field>

      <Field label="TAGS">
        <TagsField />
      </Field>

      {collection === 'articles' && (
        <Field label="DEK">
          <Textarea
            sm
            value={dek}
            onChange={(e) => {
              setKey('dek', e.target.value);
              if (typeof frontmatter.description === 'string') {
                setKey('description', e.target.value);
              }
            }}
            rows={2}
            style={{ minHeight: 50 }}
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
        <Input
          sm
          mono
          value={image}
          onChange={(e) => setKey('image', e.target.value)}
          style={{ fontSize: 11.5 }}
          placeholder="./assets/…"
          spellCheck={false}
        />
      </Field>

      {collection === 'articles' && (
        <Field label="FEATURED">
          <Checkbox
            checked={featured}
            onChange={(v) => setKey('featured', v || undefined)}
          >
            홈 상단 노출
          </Checkbox>
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

  const onChange = (next: string[]) => {
    const fm = { ...frontmatter };
    if (next.length === 0) {
      delete fm.tags;
    } else {
      fm.tags = next;
    }
    setFrontmatter(fm);
  };

  return <TagInput value={tags} onChange={onChange} />;
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
    <Input
      sm
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="시리즈 이름"
    />
  );
}

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
