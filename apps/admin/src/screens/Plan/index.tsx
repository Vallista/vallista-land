import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Task } from '@vallista/content-core';
import { deleteTask, listTasks, updateTask } from '../../lib/tauri';
import { Mono, PageHead } from '../../components/atoms/Atoms';
import { TaskRow } from './TaskRow';
import { QuickAdd } from './QuickAdd';

export type Filter = 'open' | 'today' | 'overdue' | 'done' | 'all';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'open', label: '미완료' },
  { id: 'today', label: '오늘' },
  { id: 'overdue', label: '연체' },
  { id: 'done', label: '완료' },
  { id: 'all', label: '전체' },
];

export function Plan() {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('open');

  const refresh = useCallback(() => {
    listTasks()
      .then(setTasks)
      .catch((e: unknown) => setError(String(e)));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const upsert = useCallback((task: Task) => {
    setTasks((prev) => {
      if (!prev) return [task];
      const idx = prev.findIndex((t) => t.id === task.id);
      if (idx === -1) return [...prev, task];
      const next = prev.slice();
      next[idx] = task;
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setTasks((prev) => prev?.filter((t) => t.id !== id) ?? null);
  }, []);

  const filtered = useMemo(() => {
    if (!tasks) return [];
    const today = todayKey();
    return tasks
      .filter((t) => {
        if (filter === 'all') return true;
        if (filter === 'done') return t.done;
        if (filter === 'open') return !t.done;
        if (filter === 'today') return !t.done && t.due && dayKey(t.due) === today;
        if (filter === 'overdue') return !t.done && t.due && dayKey(t.due) < today;
        return true;
      })
      .sort(taskSort);
  }, [tasks, filter]);

  const counts = useMemo(() => {
    const c = { open: 0, today: 0, overdue: 0, done: 0, all: 0 };
    if (!tasks) return c;
    const today = todayKey();
    for (const t of tasks) {
      c.all += 1;
      if (t.done) c.done += 1;
      else c.open += 1;
      if (!t.done && t.due) {
        const k = dayKey(t.due);
        if (k === today) c.today += 1;
        if (k < today) c.overdue += 1;
      }
    }
    return c;
  }, [tasks]);

  if (error) {
    return (
      <div style={{ padding: '32px 48px', maxWidth: 1120 }}>
        <PageHead title="할 일" sub="tasks 읽기 실패" />
        <div
          style={{
            padding: 16,
            border: '1px solid var(--err-soft)',
            background: 'var(--err-soft)',
            color: 'var(--err)',
            borderRadius: 8,
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
          }}
        >
          {error}
        </div>
      </div>
    );
  }

  if (!tasks) {
    return (
      <div style={{ padding: '32px 48px', maxWidth: 1120 }}>
        <PageHead title="할 일" sub="tasks 읽는 중…" />
      </div>
    );
  }

  return (
    <div style={{ padding: '28px 48px 48px', maxWidth: 880, margin: '0 auto' }}>
      <PageHead
        title="할 일"
        sub={`${counts.open}개 미완료 · ${counts.today}개 오늘 · ${counts.overdue}개 연체`}
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
        {FILTERS.map((f) => (
          <FilterChip
            key={f.id}
            active={filter === f.id}
            onClick={() => setFilter(f.id)}
            count={counts[f.id]}
          >
            {f.label}
          </FilterChip>
        ))}
      </div>

      <QuickAdd
        onAdded={(t) => {
          upsert(t);
          if (filter === 'done' && !t.done) setFilter('open');
        }}
      />

      <div style={{ marginTop: 18 }}>
        {filtered.length === 0 ? (
          <Empty filter={filter} />
        ) : (
          filtered.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              onUpdate={async (patch) => {
                const updated = await updateTask(t.id, patch);
                upsert(updated);
              }}
              onDelete={async () => {
                await deleteTask(t.id);
                remove(t.id);
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 11px',
        borderRadius: 999,
        border: '1px solid transparent',
        background: active ? 'var(--ink)' : 'transparent',
        color: active ? 'var(--on-accent)' : 'var(--ink-soft)',
        fontSize: 11.5,
        fontFamily: 'inherit',
        cursor: 'pointer',
        lineHeight: 1.2,
      }}
    >
      <span>{children}</span>
      <Mono
        style={{
          fontSize: 10,
          color: active ? 'var(--on-accent)' : 'var(--ink-mute)',
          opacity: 0.85,
        }}
      >
        {count}
      </Mono>
    </button>
  );
}

function Empty({ filter }: { filter: Filter }) {
  const text =
    filter === 'today'
      ? '오늘 할 일이 없습니다'
      : filter === 'overdue'
        ? '연체된 할 일이 없습니다'
        : filter === 'done'
          ? '완료한 할 일이 없습니다'
          : filter === 'open'
            ? '모두 비웠습니다 ✓'
            : '아직 할 일이 없습니다';
  return (
    <div
      style={{
        color: 'var(--ink-mute)',
        textAlign: 'center',
        padding: '40px 0',
        fontStyle: 'italic',
        fontSize: 13,
      }}
    >
      {text}
    </div>
  );
}

function taskSort(a: Task, b: Task): number {
  if (a.done !== b.done) return a.done ? 1 : -1;
  const ad = a.due ?? '';
  const bd = b.due ?? '';
  if (ad && bd) return ad < bd ? -1 : ad > bd ? 1 : 0;
  if (ad) return -1;
  if (bd) return 1;
  return a.createdAt < b.createdAt ? -1 : 1;
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function dayKey(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return iso.slice(0, 10);
  const d = new Date(t);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
