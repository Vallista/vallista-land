import { useEffect, useRef, useState } from 'react';
import type { Task } from '@vallista/content-core';
import type { TaskPatch } from '../../lib/tauri';
import { Mono } from '../../components/atoms/Atoms';

type Props = {
  task: Task;
  onUpdate: (patch: TaskPatch) => Promise<void>;
  onDelete: () => Promise<void>;
};

export function TaskRow({ task, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  useEffect(() => {
    setDraft(task.title);
  }, [task.title]);

  const overdue = !task.done && isOverdue(task.due);
  const today = !task.done && isToday(task.due);

  const wrap = async <T,>(p: () => Promise<T>) => {
    setBusy(true);
    setError(null);
    try {
      await p();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const toggleDone = () => wrap(() => onUpdate({ done: !task.done }));

  const commitTitle = async () => {
    const t = draft.trim();
    if (!t || t === task.title) {
      setEditing(false);
      setDraft(task.title);
      return;
    }
    await wrap(() => onUpdate({ title: t }));
    setEditing(false);
  };

  const setDue = async (val: string) => {
    await wrap(() => onUpdate({ due: val ? `${val}T00:00:00Z` : null }));
  };

  const remove = () => {
    if (!confirm(`"${task.title}" 삭제할까요?`)) return;
    wrap(onDelete);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 4px',
        borderBottom: '1px solid var(--line)',
        opacity: task.done ? 0.55 : 1,
      }}
    >
      <button
        onClick={toggleDone}
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

      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commitTitle();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              setEditing(false);
              setDraft(task.title);
            }
          }}
          style={{
            flex: 1,
            padding: '3px 6px',
            background: 'var(--bg-input, var(--bg))',
            border: '1px solid var(--line)',
            borderRadius: 4,
            color: 'var(--ink)',
            fontSize: 13.5,
            fontFamily: 'inherit',
            outline: 'none',
          }}
        />
      ) : (
        <button
          onClick={() => !task.done && setEditing(true)}
          disabled={task.done}
          style={{
            flex: 1,
            minWidth: 0,
            background: 'transparent',
            border: 'none',
            padding: '3px 0',
            color: 'var(--ink)',
            fontFamily: 'inherit',
            fontSize: 13.5,
            textAlign: 'left',
            textDecoration: task.done ? 'line-through' : 'none',
            cursor: task.done ? 'default' : 'text',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {task.title}
        </button>
      )}

      <DueChip
        due={task.due}
        overdue={overdue}
        today={today}
        disabled={busy}
        onChange={setDue}
      />

      {task.docId && (
        <span
          title={task.docId}
          style={{
            fontFamily: 'var(--font-mono)',
            fontVariantNumeric: 'tabular-nums',
            fontSize: 10,
            color: 'var(--blue)',
            background: 'var(--blue-soft)',
            padding: '2px 6px',
            borderRadius: 999,
          }}
        >
          ↗ doc
        </span>
      )}

      <button
        onClick={remove}
        disabled={busy}
        title="삭제"
        style={{
          width: 22,
          height: 22,
          border: 'none',
          background: 'transparent',
          color: 'var(--ink-mute)',
          fontSize: 14,
          lineHeight: 1,
          cursor: busy ? 'wait' : 'pointer',
          borderRadius: 4,
          padding: 0,
          opacity: 0.6,
        }}
      >
        ×
      </button>

      {error && (
        <Mono style={{ fontSize: 10, color: 'var(--err)' }}>{error}</Mono>
      )}
    </div>
  );
}

function DueChip({
  due,
  overdue,
  today,
  disabled,
  onChange,
}: {
  due?: string;
  overdue: boolean;
  today: boolean;
  disabled: boolean;
  onChange: (val: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="date"
        defaultValue={due ? due.slice(0, 10) : ''}
        onBlur={(e) => {
          onChange(e.target.value);
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === 'Escape') {
            (e.target as HTMLInputElement).blur();
          }
        }}
        disabled={disabled}
        style={{
          padding: '2px 6px',
          background: 'var(--bg)',
          border: '1px solid var(--line)',
          borderRadius: 4,
          color: 'var(--ink-soft)',
          fontSize: 10.5,
          fontFamily: 'var(--font-mono)',
          outline: 'none',
        }}
      />
    );
  }

  if (!due) {
    return (
      <button
        onClick={() => setEditing(true)}
        disabled={disabled}
        style={chipStyle('var(--ink-faint)', 'transparent', 'var(--line)')}
      >
        날짜
      </button>
    );
  }

  const color = overdue ? 'var(--err)' : today ? 'var(--warn)' : 'var(--ink-mute)';
  const bg = overdue ? 'var(--err-soft)' : today ? 'var(--warn-soft)' : 'var(--bg-shade)';
  const label = formatDue(due);

  return (
    <button
      onClick={() => setEditing(true)}
      disabled={disabled}
      style={chipStyle(color, bg, 'transparent')}
      title={due}
    >
      {label}
    </button>
  );
}

function chipStyle(color: string, bg: string, border: string): React.CSSProperties {
  return {
    padding: '2px 8px',
    border: `1px solid ${border}`,
    background: bg,
    color,
    fontSize: 10.5,
    fontFamily: 'var(--font-mono)',
    borderRadius: 999,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  };
}

function isOverdue(due?: string): boolean {
  if (!due) return false;
  return dayKey(due) < todayKey();
}

function isToday(due?: string): boolean {
  if (!due) return false;
  return dayKey(due) === todayKey();
}

function formatDue(due: string): string {
  const t = Date.parse(due);
  if (!Number.isFinite(t)) return due.slice(0, 10);
  const d = new Date(t);
  const today = new Date();
  const dayDiff = Math.round((d.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / 86_400_000);
  if (dayDiff === 0) return '오늘';
  if (dayDiff === 1) return '내일';
  if (dayDiff === -1) return '어제';
  if (dayDiff > 0 && dayDiff <= 7) return `${dayDiff}일 뒤`;
  if (dayDiff < 0 && dayDiff >= -14) return `${Math.abs(dayDiff)}일 전`;
  return `${d.getMonth() + 1}/${d.getDate()}`;
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
