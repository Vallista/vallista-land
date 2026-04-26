import { useState } from 'react';
import type { Task } from '@vallista/content-core';
import { Mono } from '../../components/atoms/Atoms';

type Props = {
  tasks: Task[];
  loading: boolean;
  onToggle: (id: string, done: boolean) => Promise<void>;
};

export function TodayTasks({ tasks, loading, onToggle }: Props) {
  if (loading) return <Loading />;
  if (tasks.length === 0) {
    return (
      <div
        style={{
          padding: '24px 0',
          color: 'var(--ink-mute)',
          fontSize: 13,
          fontStyle: 'italic',
          textAlign: 'center',
        }}
      >
        오늘 해야 할 일이 없습니다 ✓
      </div>
    );
  }

  const todayKeyVal = todayKey();
  return (
    <div>
      {tasks.map((t) => {
        const key = t.due ? dayKey(t.due) : '';
        const overdue = key !== '' && key < todayKeyVal;
        return <Row key={t.id} task={t} overdue={overdue} onToggle={onToggle} />;
      })}
    </div>
  );
}

function Row({
  task,
  overdue,
  onToggle,
}: {
  task: Task;
  overdue: boolean;
  onToggle: (id: string, done: boolean) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const handle = async () => {
    setBusy(true);
    try {
      await onToggle(task.id, !task.done);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '7px 4px',
        borderBottom: '1px solid var(--line)',
      }}
    >
      <button
        onClick={handle}
        disabled={busy}
        title={task.done ? '미완료로 되돌리기' : '완료'}
        style={{
          width: 16,
          height: 16,
          border: `1.5px solid ${task.done ? 'var(--ok)' : 'var(--line-strong, var(--ink-mute))'}`,
          borderRadius: 4,
          background: task.done ? 'var(--ok)' : 'transparent',
          color: 'var(--on-accent)',
          fontSize: 10,
          fontFamily: 'inherit',
          lineHeight: 1,
          cursor: busy ? 'wait' : 'pointer',
          padding: 0,
          flex: '0 0 16px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {task.done ? '✓' : ''}
      </button>

      <span
        style={{
          flex: 1,
          minWidth: 0,
          color: 'var(--ink)',
          fontSize: 13.5,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {task.title}
      </span>

      {task.due && (
        <Mono
          style={{
            fontSize: 10.5,
            padding: '2px 8px',
            borderRadius: 999,
            color: overdue ? 'var(--err)' : 'var(--warn)',
            background: overdue ? 'var(--err-soft)' : 'var(--warn-soft)',
          }}
        >
          {overdue ? `${diffDays(task.due)}일 연체` : '오늘'}
        </Mono>
      )}
    </div>
  );
}

function Loading() {
  return (
    <div
      style={{
        padding: '20px 0',
        color: 'var(--ink-faint)',
        fontSize: 12,
        fontFamily: 'var(--font-mono)',
      }}
    >
      읽는 중…
    </div>
  );
}

function diffDays(due: string): number {
  const t = Date.parse(due);
  if (!Number.isFinite(t)) return 0;
  const d = new Date(t);
  const today = new Date();
  return Math.abs(
    Math.round(
      (new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() -
        new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) /
        86_400_000,
    ),
  );
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
