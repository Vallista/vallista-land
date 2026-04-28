export type ThoughtType = 'thought' | 'glean' | 'blog';
export type ThoughtState = 'inbox' | 'doing' | 'done' | 'archived';
export type ThoughtLabel = 'gray' | 'blue' | 'green' | 'amber' | 'rose' | 'violet' | 'cyan';

export interface Thought {
  id: string;
  type: ThoughtType;
  state: ThoughtState;
  title: string;
  body?: string;
  label?: ThoughtLabel;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  promotedTo?: 'task' | 'note';
}

const STORAGE_KEY = 'bento.thoughts.v1';

export const TYPE_META: Record<ThoughtType, { label: string; glyph: string; tone: string }> = {
  thought: { label: '생각', glyph: '⌇', tone: 'var(--ink-mute)' },
  glean: { label: '줍기', glyph: '⊞', tone: 'var(--blue)' },
  blog: { label: '블로그', glyph: '▤', tone: 'var(--hl-violet)' },
};

export const STATE_META: Record<ThoughtState, { label: string; tone: string }> = {
  inbox: { label: '대기', tone: 'var(--ink-mute)' },
  doing: { label: '진행', tone: 'var(--blue)' },
  done: { label: '완료', tone: 'var(--ok)' },
  archived: { label: '보관', tone: 'var(--ink-faint)' },
};

export const LABEL_PALETTE: Record<ThoughtLabel, { name: string; bg: string; fg: string }> = {
  gray: { name: '회색', bg: 'rgba(148,163,184,0.15)', fg: 'var(--ink-2)' },
  blue: { name: '파랑', bg: 'rgba(59,130,246,0.18)', fg: 'var(--blue)' },
  green: { name: '녹색', bg: 'rgba(34,197,94,0.18)', fg: 'var(--ok)' },
  amber: { name: '주황', bg: 'rgba(245,158,11,0.20)', fg: 'var(--warn)' },
  rose: { name: '진홍', bg: 'rgba(244,63,94,0.18)', fg: 'var(--err)' },
  violet: { name: '보라', bg: 'rgba(167,139,250,0.20)', fg: 'var(--hl-violet)' },
  cyan: { name: '청록', bg: 'rgba(34,211,238,0.18)', fg: '#22d3ee' },
};

interface LegacyThought {
  id: string;
  text: string;
  createdAt: string;
  promotedTo?: 'task' | 'note';
}

function migrate(raw: unknown): Thought[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((it) => {
    if (it && typeof it === 'object' && 'title' in it && 'type' in it) {
      const t = it as Thought;
      return {
        ...t,
        tags: Array.isArray(t.tags) ? t.tags : [],
        state: t.state ?? 'inbox',
        type: t.type ?? 'thought',
        updatedAt: t.updatedAt ?? t.createdAt,
      };
    }
    const legacy = it as LegacyThought;
    const text = (legacy.text ?? '').toString();
    const lines = text.split('\n');
    const title = (lines[0] ?? '').trim() || '(제목 없음)';
    const body = lines.slice(1).join('\n').trim() || undefined;
    return {
      id: legacy.id ?? cryptoRandom(),
      type: 'thought',
      state: legacy.promotedTo ? 'done' : 'inbox',
      title: title.slice(0, 200),
      body,
      tags: [],
      createdAt: legacy.createdAt ?? new Date().toISOString(),
      updatedAt: legacy.createdAt ?? new Date().toISOString(),
      promotedTo: legacy.promotedTo,
    } satisfies Thought;
  });
}

export function loadThoughts(): Thought[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return migrate(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function saveThoughts(items: Thought[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function countThoughts(): number {
  return loadThoughts().filter((t) => t.state !== 'archived' && t.state !== 'done').length;
}

export function cryptoRandom(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return (crypto as Crypto & { randomUUID(): string }).randomUUID();
  }
  return `t_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function newThought(input: {
  type: ThoughtType;
  title: string;
  body?: string;
  label?: ThoughtLabel;
  tags?: string[];
}): Thought {
  const now = new Date().toISOString();
  return {
    id: cryptoRandom(),
    type: input.type,
    state: 'inbox',
    title: input.title.slice(0, 200),
    body: input.body?.trim() || undefined,
    label: input.label,
    tags: input.tags ?? [],
    createdAt: now,
    updatedAt: now,
  };
}
