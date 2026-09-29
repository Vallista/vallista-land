import { useEffect, useState } from 'react';
import type { Task } from '@vallista/content-core';
import {
  addEventSubtask,
  deleteEventSubtask,
  listEventSubtasks,
  toggleEventSubtask,
  type EventSubtask,
} from '../../lib/tauri';
import { Eyebrow, Input, Mono } from '../../components/atoms/Atoms';
import { CheckIcon } from '../../components/atoms/Icons';
import { LabelPicker } from '../../components/LabelPicker';
import { EventNotesPanel } from './EventNotesPanel';

interface Props {
  open: boolean;
  task: Task | null;
  onClose: () => void;
  onSave: (patch: {
    title: string;
    done?: boolean;
    color?: string | null;
    kind?: string | null;
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export function TaskEditor({ open, task, onClose, onSave, onDelete }: Props) {
  const [title, setTitle] = useState('');
  const [eventSubtasks, setEventSubtasks] = useState<EventSubtask[]>([]);
  const [draftSub, setDraftSub] = useState('');
  const [color, setColor] = useState('');
  const [taskKind, setTaskKind] = useState('write');
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open || !task) return;
    setTitle(task.title);
    setDraftSub('');
    setColor(task.color ?? '');
    setTaskKind(task.kind ?? 'write');
    setConfirmDelete(false);
    let cancelled = false;
    listEventSubtasks(`task:${task.id}`).then((items) => {
      if (!cancelled) setEventSubtasks(items);
    });
    return () => { cancelled = true; };
  }, [open, task]);

  useEffect(() => {
    if (!confirmDelete) return;
    const timer = window.setTimeout(() => setConfirmDelete(false), 4000);
    return () => window.clearTimeout(timer);
  }, [confirmDelete]);

  const progress = eventSubtasks.length > 0
    ? { done: eventSubtasks.filter((s) => s.done).length, total: eventSubtasks.length }
    : null;

  if (!open || !task) return null;

  const eventKey = `task:${task.id}`;

  const notify = () => window.dispatchEvent(new CustomEvent('bento:subtasks-changed'));

  const addSubtask = async () => {
    const t = draftSub.trim();
    if (!t || !task) return;
    setDraftSub('');
    const created = await addEventSubtask({
      eventKey,
      seriesKey: eventKey,
      eventTitleSnapshot: task.title,
      eventDateSnapshot: '',
      title: t,
    });
    setEventSubtasks((prev) => [...prev, created]);
    notify();
  };

  const toggleSub = async (id: string, done: boolean) => {
    const updated = await toggleEventSubtask(eventKey, id, done);
    setEventSubtasks((prev) => prev.map((s) => s.id === updated.id ? updated : s));
    notify();
  };

  const removeSub = async (id: string) => {
    await deleteEventSubtask(eventKey, id);
    setEventSubtasks((prev) => prev.filter((s) => s.id !== id));
    notify();
  };

  const submit = async () => {
    const t = title.trim();
    if (!t) return;
    setBusy(true);
    try {
      if (draftSub.trim()) {
        await addSubtask();
      }
      await onSave({
        title: t,
        color: color || null,
        kind: taskKind,
      });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || busy) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setBusy(true);
    try {
      await onDelete();
      setConfirmDelete(false);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: 16,
      }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          width: 'min(520px, 94vw)',
          maxHeight: '88vh',
          background: 'var(--bg-soft)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-pop)',
          padding: '20px 22px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Eyebrow>할 일 편집</Eyebrow>
          <button
            onClick={onClose}
            title="닫기 (ESC)"
            style={iconBtnStyle}
          >
            ×
          </button>
        </div>

        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              onClose();
            }
          }}
          placeholder="제목"
          style={{
            padding: '9px 11px',
            fontSize: 14,
            fontWeight: 500,
            background: 'var(--bg)',
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>종류 · 색상</Mono>
          <LabelPicker
            kind={taskKind}
            color={color}
            onChange={(k, c) => { setTaskKind(k); setColor(c); }}
          />
        </div>

        <EventNotesPanel
          eventKey={eventKey}
          seriesKey={eventKey}
          titleSnapshot={task.title}
          dateSnapshot={''}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>
              체크리스트
            </Mono>
            {progress && (
              <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>
                {progress.done}/{progress.total}
              </Mono>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {eventSubtasks.map((s) => (
              <SubRow
                key={s.id}
                sub={s}
                onToggle={() => void toggleSub(s.id, !s.done)}
                onRemove={() => void removeSub(s.id)}
              />
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Input
              value={draftSub}
              onChange={(e) => setDraftSub(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void addSubtask();
                }
              }}
              placeholder="+ 체크리스트 추가"
              style={{
                flex: 1,
                padding: '6px 10px',
                fontSize: 12,
                border: '1px dashed var(--line)',
                background: 'transparent',
                borderRadius: 5,
              }}
            />
            <button
              onClick={() => void addSubtask()}
              disabled={!draftSub.trim()}
              style={{
                padding: '6px 10px',
                fontSize: 11,
                border: '1px solid var(--line)',
                background: draftSub.trim() ? 'var(--bg-shade)' : 'transparent',
                color: draftSub.trim() ? 'var(--ink)' : 'var(--ink-mute)',
                borderRadius: 5,
                cursor: draftSub.trim() ? 'pointer' : 'default',
                fontFamily: 'inherit',
              }}
            >
              추가
            </button>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 8,
            marginTop: 6,
          }}
        >
          {onDelete ? (
            <button
              onClick={handleDelete}
              disabled={busy}
              style={{
                padding: '7px 12px',
                fontSize: 12,
                border: `1px solid ${confirmDelete ? 'var(--err)' : 'var(--line)'}`,
                background: confirmDelete ? 'var(--err)' : 'transparent',
                color: confirmDelete ? 'white' : 'var(--err)',
                borderRadius: 6,
                fontFamily: 'inherit',
                cursor: busy ? 'default' : 'pointer',
              }}
            >
              {confirmDelete ? '한 번 더 눌러 삭제' : '삭제'}
            </button>
          ) : (
            <span />
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onClose}
              style={{
                padding: '7px 14px',
                fontSize: 12,
                border: '1px solid var(--line)',
                background: 'transparent',
                color: 'var(--ink-soft)',
                borderRadius: 6,
                fontFamily: 'inherit',
                cursor: 'pointer',
              }}
            >
              취소
            </button>
            <button
              onClick={submit}
              disabled={busy || !title.trim()}
              style={{
                padding: '7px 14px',
                fontSize: 12,
                border: 'none',
                background: title.trim() ? 'var(--ink)' : 'var(--bg-shade)',
                color: title.trim() ? 'var(--on-accent)' : 'var(--ink-mute)',
                borderRadius: 6,
                cursor: title.trim() && !busy ? 'pointer' : 'default',
                fontFamily: 'inherit',
                fontWeight: 500,
              }}
            >
              {busy ? '…' : '저장'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SubRow({
  sub,
  onToggle,
  onRemove,
}: {
  sub: EventSubtask;
  onToggle: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '5px 8px',
        border: '1px solid var(--line)',
        background: 'var(--bg)',
        borderRadius: 5,
      }}
    >
      <button
        onClick={onToggle}
        title={sub.done ? '취소' : '완료'}
        style={{
          width: 16,
          height: 16,
          flexShrink: 0,
          border: '1px solid var(--line-strong)',
          background: sub.done ? 'var(--ok)' : 'transparent',
          borderRadius: 3,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        {sub.done && <CheckIcon size={10} />}
      </button>
      <span
        style={{
          flex: 1,
          padding: '3px 4px',
          fontSize: 12,
          textDecoration: sub.done ? 'line-through' : 'none',
          opacity: sub.done ? 0.6 : 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {sub.title}
      </span>
      <button
        onClick={onRemove}
        title="삭제"
        style={{
          ...iconBtnStyle,
          width: 20,
          height: 20,
          fontSize: 14,
        }}
      >
        ×
      </button>
    </div>
  );
}

const iconBtnStyle: React.CSSProperties = {
  width: 22,
  height: 22,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  background: 'transparent',
  color: 'var(--ink-mute)',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 16,
  lineHeight: 1,
};
