import { useState, useEffect, type CSSProperties, type FormEvent } from 'react';
import type { RadarTask, RadarTaskInput, TaskStatus } from './types';
import { TASK_STATUS_LABELS } from './types';
import { ModalShell } from './GoalForm';
import { listTasks, listDocs } from '../../lib/tauri';
import type { Task, DocSummary } from '@vallista/content-core';

interface TaskFormProps {
  goalId: string;
  task?: RadarTask;
  parentTaskId?: string;
  onSave: (input: RadarTaskInput) => void;
  onClose: () => void;
}

export function TaskForm({ goalId, task, parentTaskId, onSave, onClose }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [isMine, setIsMine] = useState<boolean>(task?.isMine ?? true);
  const [assignee, setAssignee] = useState(task?.assignee ?? '');
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? 'not_started');
  const [deadline, setDeadline] = useState<string>(task?.deadline?.slice(0, 10) ?? '');
  const [notes, setNotes] = useState(task?.notes ?? '');
  const [planTasks, setPlanTasks] = useState<Task[]>([]);
  const [docs, setDocs] = useState<DocSummary[]>([]);
  const [planTaskId, setPlanTaskId] = useState(task?.planTaskId ?? '');
  const [docPath, setDocPath] = useState(task?.docPath ?? '');

  useEffect(() => {
    void listTasks().then(setPlanTasks).catch(() => {});
    void listDocs().then(setDocs).catch(() => {});
  }, []);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const input: RadarTaskInput = {
      id: task?.id ?? `radar_task_${Date.now()}`,
      goalId,
      title: title.trim(),
      assignee: isMine ? undefined : assignee.trim() || undefined,
      isMine,
      status,
      deadline: deadline || undefined,
      planTaskId: planTaskId || undefined,
      docPath: docPath || undefined,
      notes: notes.trim() || undefined,
      parentTaskId: task ? task.parentTaskId : parentTaskId || undefined,
    };
    onSave(input);
  };

  return (
    <ModalShell onClose={onClose} title={task ? '할 일 편집' : '새 할 일'}>
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="제목">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="할 일 이름"
            style={inputStyle}
            required
          />
        </Field>

        <Field label="담당자 타입">
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              onClick={() => setIsMine(true)}
              style={pillStyle(isMine)}
            >
              내 할 일
            </button>
            <button
              type="button"
              onClick={() => setIsMine(false)}
              style={pillStyle(!isMine)}
            >
              위임한 일
            </button>
          </div>
        </Field>

        {!isMine && (
          <Field label="담당자 이름">
            <input
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="이름"
              style={inputStyle}
            />
          </Field>
        )}

        <Field label="상태">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(Object.keys(TASK_STATUS_LABELS) as TaskStatus[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                style={pillStyle(status === s)}
              >
                {TASK_STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </Field>

        <Field label="마감일">
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            style={inputStyle}
          />
        </Field>

        <fieldset
          style={{
            border: '1px solid var(--line)',
            borderRadius: 6,
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <legend
            style={{
              fontSize: 10.5,
              color: 'var(--ink-mute)',
              padding: '0 4px',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            연동 (선택)
          </legend>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={linkLabelStyle}>플랜</span>
            <SelectWrap>
              <select
                value={planTaskId}
                onChange={(e) => setPlanTaskId(e.target.value)}
                style={selectStyle}
              >
                <option value="">(없음)</option>
                {planTasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}{t.due ? ` · ${t.due.slice(0, 10)}` : ''}
                  </option>
                ))}
              </select>
            </SelectWrap>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={linkLabelStyle}>블로그</span>
            <SelectWrap>
              <select
                value={docPath}
                onChange={(e) => setDocPath(e.target.value)}
                style={selectStyle}
              >
                <option value="">(없음)</option>
                {docs.map((d) => (
                  <option key={d.path} value={d.path}>
                    {d.title}
                  </option>
                ))}
              </select>
            </SelectWrap>
          </div>
        </fieldset>

        <Field label="노트">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="메모"
            style={{
              ...inputStyle,
              minHeight: 80,
              resize: 'vertical',
              fontFamily: 'inherit',
              lineHeight: 1.5,
            }}
          />
        </Field>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
          <button type="button" onClick={onClose} style={ghostBtnStyle}>
            취소
          </button>
          <button type="submit" style={primaryBtnStyle}>
            저장
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span
        style={{
          fontSize: 11,
          color: 'var(--ink-mute)',
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

const inputStyle: CSSProperties = {
  padding: '7px 10px',
  borderRadius: 5,
  border: '1px solid var(--line)',
  background: 'var(--bg-input)',
  color: 'var(--ink)',
  fontSize: 13,
  width: '100%',
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
};

const linkLabelStyle: CSSProperties = {
  fontSize: 11,
  color: 'var(--ink-mute)',
  fontFamily: 'var(--font-mono)',
  flex: '0 0 44px',
  letterSpacing: '0.03em',
};

const selectStyle: CSSProperties = {
  width: '100%',
  padding: '6px 28px 6px 10px',
  borderRadius: 5,
  border: '1px solid var(--line)',
  background: 'var(--bg-input)',
  color: 'var(--ink)',
  fontSize: 12.5,
  fontFamily: 'inherit',
  outline: 'none',
  appearance: 'none',
  WebkitAppearance: 'none',
  cursor: 'pointer',
};

function SelectWrap({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
      {children}
      <span
        style={{
          position: 'absolute',
          right: 8,
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
          color: 'var(--ink-mute)',
          fontSize: 10,
          lineHeight: 1,
        }}
      >
        ▾
      </span>
    </div>
  );
}

const ghostBtnStyle: CSSProperties = {
  padding: '7px 14px',
  borderRadius: 5,
  border: '1px solid var(--line-strong)',
  background: 'transparent',
  color: 'var(--ink)',
  fontSize: 12.5,
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontWeight: 500,
};

const primaryBtnStyle: CSSProperties = {
  padding: '7px 14px',
  borderRadius: 5,
  border: 'none',
  background: 'var(--ink)',
  color: 'var(--on-accent)',
  fontSize: 12.5,
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontWeight: 500,
};

function pillStyle(active: boolean): CSSProperties {
  return {
    padding: '5px 12px',
    borderRadius: 999,
    border: `1px solid ${active ? 'var(--ink)' : 'var(--line)'}`,
    background: active ? 'var(--ink)' : 'transparent',
    color: active ? 'var(--on-accent)' : 'var(--ink-2)',
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontWeight: 500,
  };
}
