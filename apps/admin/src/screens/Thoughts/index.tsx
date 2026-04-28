import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Mono, PageHead } from '../../components/atoms/Atoms';
import { addTask } from '../../lib/tauri';
import { useNavigate } from '../../shell/nav';
import {
  LABEL_PALETTE,
  STATE_META,
  TYPE_META,
  cryptoRandom,
  loadThoughts,
  saveThoughts,
  type Thought,
  type ThoughtLabel,
  type ThoughtState,
  type ThoughtType,
} from '../../lib/thoughts';

type TypeFilter = ThoughtType | 'all';
type StateFilter = ThoughtState | 'open';

const TYPE_FILTERS: { id: TypeFilter; label: string; glyph: string }[] = [
  { id: 'all', label: '전체', glyph: '◇' },
  { id: 'thought', label: TYPE_META.thought.label, glyph: TYPE_META.thought.glyph },
  { id: 'glean', label: TYPE_META.glean.label, glyph: TYPE_META.glean.glyph },
  { id: 'blog', label: TYPE_META.blog.label, glyph: TYPE_META.blog.glyph },
];

const STATE_FILTERS: { id: StateFilter; label: string }[] = [
  { id: 'open', label: '열린 항목' },
  { id: 'inbox', label: '대기' },
  { id: 'doing', label: '진행' },
  { id: 'done', label: '완료' },
  { id: 'archived', label: '보관' },
];

export function Thoughts() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Thought[]>(() => loadThoughts());
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [stateFilter, setStateFilter] = useState<StateFilter>('open');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    saveThoughts(items);
  }, [items]);

  useEffect(() => {
    const refresh = () => setItems(loadThoughts());
    window.addEventListener('bento:thoughts-changed', refresh);
    return () => window.removeEventListener('bento:thoughts-changed', refresh);
  }, []);

  const counts = useMemo(() => {
    const c: Record<TypeFilter, number> = { all: 0, thought: 0, glean: 0, blog: 0 };
    for (const it of items) {
      if (it.state === 'archived') continue;
      c.all += 1;
      c[it.type] += 1;
    }
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    return items
      .filter((t) => (typeFilter === 'all' ? true : t.type === typeFilter))
      .filter((t) => {
        if (stateFilter === 'open') return t.state !== 'done' && t.state !== 'archived';
        return t.state === stateFilter;
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [items, typeFilter, stateFilter]);

  const update = useCallback((id: string, patch: Partial<Thought>) => {
    setItems((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, ...patch, updatedAt: new Date().toISOString() }
          : p,
      ),
    );
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toTask = useCallback(
    async (t: Thought) => {
      try {
        await addTask({ id: cryptoRandom(), title: t.title.slice(0, 200) });
        update(t.id, { promotedTo: 'task', state: 'done' });
      } catch (e: unknown) {
        setError(String(e));
      }
    },
    [update],
  );

  const toNote = useCallback(
    (t: Thought) => {
      const text = t.body ? `${t.title}\n\n${t.body}` : t.title;
      try {
        window.sessionStorage.setItem('bento.atelier.draft', text);
      } catch {
        /* ignore */
      }
      update(t.id, { promotedTo: 'note', state: 'done' });
      navigate('atelier');
    },
    [navigate, update],
  );

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--bg)' }}>
      <div style={{ padding: '32px 48px 80px', maxWidth: 980, margin: '0 auto' }}>
        <PageHead
          title="생각"
          sub="머리에서 흘러나온 한 줄을 분류·라벨로 정리하는 백로그"
          right={
            <Mono style={{ fontSize: 11, color: 'var(--ink-mute)' }}>
              ⌘N 빠른 생각 · ⌘T 빠른 할 일
            </Mono>
          }
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexWrap: 'wrap',
            paddingBottom: 12,
            borderBottom: '1px solid var(--line)',
            marginBottom: 12,
          }}
        >
          {TYPE_FILTERS.map((f) => {
            const active = typeFilter === f.id;
            const n = counts[f.id];
            return (
              <button
                key={f.id}
                onClick={() => setTypeFilter(f.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 999,
                  border: '1px solid transparent',
                  background: active ? 'var(--ink)' : 'transparent',
                  color: active ? 'var(--on-accent)' : 'var(--ink-soft)',
                  fontFamily: 'inherit',
                  fontSize: 11.5,
                  fontWeight: active ? 600 : 500,
                  cursor: 'pointer',
                  lineHeight: 1.2,
                }}
              >
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{f.glyph}</span>
                <span>{f.label}</span>
                <Mono style={{ fontSize: 10, opacity: 0.7 }}>{n}</Mono>
              </button>
            );
          })}
          <span style={{ flex: 1 }} />
          {STATE_FILTERS.map((f) => {
            const active = stateFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setStateFilter(f.id)}
                style={{
                  padding: '3px 9px',
                  borderRadius: 5,
                  border: '1px solid transparent',
                  background: active ? 'var(--bg-shade)' : 'transparent',
                  color: active ? 'var(--ink)' : 'var(--ink-mute)',
                  fontFamily: 'inherit',
                  fontSize: 11,
                  fontWeight: active ? 600 : 500,
                  cursor: 'pointer',
                  lineHeight: 1.2,
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {error && (
          <div
            style={{
              padding: '8px 12px',
              border: '1px solid var(--err-soft)',
              background: 'var(--err-soft)',
              color: 'var(--err)',
              borderRadius: 6,
              marginBottom: 12,
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
            }}
          >
            {error}
          </div>
        )}

        {filtered.length === 0 ? (
          <div
            style={{
              padding: '60px 0',
              textAlign: 'center',
              color: 'var(--ink-mute)',
              fontStyle: 'italic',
              fontSize: 13,
            }}
          >
            {items.length === 0
              ? '⌘N 으로 첫 생각을 남겨보세요.'
              : '필터에 맞는 항목이 없어요.'}
          </div>
        ) : (
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            {filtered.map((t) => (
              <BacklogRow
                key={t.id}
                item={t}
                onUpdate={(p) => update(t.id, p)}
                onRemove={() => remove(t.id)}
                onPromoteTask={() => toTask(t)}
                onPromoteNote={() => toNote(t)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function BacklogRow({
  item,
  onUpdate,
  onRemove,
  onPromoteTask,
  onPromoteNote,
}: {
  item: Thought;
  onUpdate: (patch: Partial<Thought>) => void;
  onRemove: () => void;
  onPromoteTask: () => void;
  onPromoteNote: () => void;
}) {
  const [open, setOpen] = useState(false);
  const typeMeta = TYPE_META[item.type];
  const stateMeta = STATE_META[item.state];
  const labelStyle = item.label ? LABEL_PALETTE[item.label] : null;

  return (
    <li
      style={{
        border: '1px solid var(--line)',
        borderLeft: labelStyle ? `3px solid ${labelStyle.fg}` : '1px solid var(--line)',
        borderRadius: 8,
        background: 'var(--bg)',
        overflow: 'hidden',
        transition: 'border-color 120ms',
      }}
    >
      <div
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 12px',
          cursor: 'pointer',
        }}
      >
        <span
          title={typeMeta.label}
          style={{
            width: 18,
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: typeMeta.tone,
            textAlign: 'center',
          }}
        >
          {typeMeta.glyph}
        </span>
        <Mono
          style={{
            fontSize: 9.5,
            color: stateMeta.tone,
            background: 'var(--bg-shade)',
            padding: '2px 6px',
            borderRadius: 4,
            letterSpacing: '0.04em',
          }}
        >
          {stateMeta.label}
        </Mono>
        <span
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: 13.5,
            color: 'var(--ink)',
            fontWeight: item.state === 'done' || item.state === 'archived' ? 400 : 500,
            textDecoration: item.state === 'done' ? 'line-through' : 'none',
            opacity: item.state === 'done' || item.state === 'archived' ? 0.6 : 1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {item.title}
        </span>
        {item.tags.slice(0, 3).map((tag) => (
          <Mono
            key={tag}
            style={{
              fontSize: 10,
              color: 'var(--ink-mute)',
              background: 'var(--bg-shade)',
              padding: '1px 6px',
              borderRadius: 3,
            }}
          >
            #{tag}
          </Mono>
        ))}
        <Mono style={{ fontSize: 10, color: 'var(--ink-faint)' }}>
          {formatTime(item.createdAt)}
        </Mono>
      </div>
      {open && (
        <div
          style={{
            padding: '10px 14px 12px',
            borderTop: '1px dashed var(--line)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            background: 'var(--bg-soft)',
          }}
        >
          {item.body && (
            <div
              className="psm-selectable"
              style={{
                fontSize: 13,
                color: 'var(--ink-2)',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
              }}
            >
              {item.body}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>상태</Mono>
            {(Object.keys(STATE_META) as ThoughtState[]).map((s) => {
              const active = item.state === s;
              const m = STATE_META[s];
              return (
                <button
                  key={s}
                  onClick={() => onUpdate({ state: s })}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 5,
                    border: active ? `1px solid ${m.tone}` : '1px solid var(--line)',
                    background: active ? 'var(--bg-shade)' : 'transparent',
                    color: active ? m.tone : 'var(--ink-mute)',
                    fontFamily: 'inherit',
                    fontSize: 10.5,
                    cursor: 'pointer',
                    lineHeight: 1.2,
                  }}
                >
                  {m.label}
                </button>
              );
            })}
            <span style={{ flex: 1 }} />
            <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>라벨</Mono>
            <button
              onClick={() => onUpdate({ label: undefined })}
              title="라벨 없음"
              style={{
                width: 16,
                height: 16,
                borderRadius: 999,
                border: !item.label ? '2px solid var(--ink)' : '1px dashed var(--line-strong)',
                background: 'transparent',
                cursor: 'pointer',
              }}
            />
            {(Object.keys(LABEL_PALETTE) as ThoughtLabel[]).map((c) => {
              const p = LABEL_PALETTE[c];
              const active = item.label === c;
              return (
                <button
                  key={c}
                  onClick={() => onUpdate({ label: c })}
                  title={p.name}
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 999,
                    border: active ? `2px solid ${p.fg}` : '1px solid transparent',
                    background: p.bg,
                    cursor: 'pointer',
                  }}
                />
              );
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {item.promotedTo === 'task' && (
              <Mono style={{ fontSize: 10, color: 'var(--blue)' }}>→ 할 일로 이동됨</Mono>
            )}
            {item.promotedTo === 'note' && (
              <Mono style={{ fontSize: 10, color: 'var(--hl-violet)' }}>→ 글방으로 이동됨</Mono>
            )}
            <span style={{ flex: 1 }} />
            <Button sm ghost onClick={onPromoteTask}>
              할 일로
            </Button>
            <Button sm ghost onClick={onPromoteNote}>
              글방으로
            </Button>
            <button
              onClick={onRemove}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--ink-mute)',
                cursor: 'pointer',
                fontSize: 11,
                fontFamily: 'inherit',
                padding: '4px 6px',
              }}
            >
              삭제
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

function formatTime(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return iso;
  const d = new Date(t);
  const today = new Date();
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  if (sameDay) {
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
