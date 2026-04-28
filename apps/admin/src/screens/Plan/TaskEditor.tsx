import { useEffect, useMemo, useState } from 'react';
import type { Subtask, Task } from '@vallista/content-core';
import { Eyebrow, Input, Mono, Textarea } from '../../components/atoms/Atoms';
import { CheckIcon } from '../../components/atoms/Icons';

interface Props {
  open: boolean;
  task: Task | null;
  onClose: () => void;
  onSave: (patch: {
    title: string;
    notes: string | null;
    subtasks: Subtask[];
    done?: boolean;
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export function TaskEditor({ open, task, onClose, onSave, onDelete }: Props) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [draftSub, setDraftSub] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open || !task) return;
    setTitle(task.title);
    setNotes(task.notes ?? '');
    setSubtasks(task.subtasks ?? []);
    setDraftSub('');
    setConfirmDelete(false);
  }, [open, task]);

  useEffect(() => {
    if (!confirmDelete) return;
    const timer = window.setTimeout(() => setConfirmDelete(false), 4000);
    return () => window.clearTimeout(timer);
  }, [confirmDelete]);

  const progress = useMemo(() => {
    if (subtasks.length === 0) return null;
    const done = subtasks.filter((s) => s.done).length;
    return { done, total: subtasks.length };
  }, [subtasks]);

  if (!open || !task) return null;

  const addSubtask = () => {
    const t = draftSub.trim();
    if (!t) return;
    setSubtasks((prev) => [
      ...prev,
      { id: makeSubId(), title: t, done: false },
    ]);
    setDraftSub('');
  };

  const toggleSub = (id: string) =>
    setSubtasks((prev) =>
      prev.map((s) => (s.id === id ? { ...s, done: !s.done } : s)),
    );

  const removeSub = (id: string) =>
    setSubtasks((prev) => prev.filter((s) => s.id !== id));

  const updateSubTitle = (id: string, next: string) =>
    setSubtasks((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: next } : s)),
    );

  const submit = async () => {
    const t = title.trim();
    if (!t) return;
    setBusy(true);
    try {
      await onSave({
        title: t,
        notes: notes.trim() || null,
        subtasks: subtasks
          .map((s) => ({ ...s, title: s.title.trim() }))
          .filter((s) => s.title.length > 0),
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>메모</Mono>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="메모를 적어두세요"
            rows={4}
            style={{
              padding: '9px 11px',
              fontSize: 12.5,
              background: 'var(--bg)',
              resize: 'vertical',
              minHeight: 80,
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>
              세부 작업
            </Mono>
            {progress && (
              <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>
                {progress.done}/{progress.total}
              </Mono>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {subtasks.map((s) => (
              <SubRow
                key={s.id}
                sub={s}
                onToggle={() => toggleSub(s.id)}
                onChange={(t) => updateSubTitle(s.id, t)}
                onRemove={() => removeSub(s.id)}
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
                  addSubtask();
                }
              }}
              placeholder="+ 세부 작업 추가"
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
              onClick={addSubtask}
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
  onChange,
  onRemove,
}: {
  sub: Subtask;
  onToggle: () => void;
  onChange: (t: string) => void;
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
      <Input
        value={sub.title}
        onChange={(e) => onChange(e.target.value)}
        style={{
          flex: 1,
          padding: '3px 4px',
          fontSize: 12,
          border: 'none',
          background: 'transparent',
          borderRadius: 0,
          textDecoration: sub.done ? 'line-through' : 'none',
          opacity: sub.done ? 0.6 : 1,
        }}
      />
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

function makeSubId(): string {
  return `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}
