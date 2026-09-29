import { useEffect, useState } from 'react';
import { Mono } from '../../components/atoms/Atoms';
import type { RadarActivity, RadarTask, RadarTaskPatch, TaskStatus } from './types';
import { TASK_STATUS_LABELS, TASK_STATUS_TONES, isDescendantOf } from './types';

interface SidePanelProps {
  task: RadarTask | null;
  activities: RadarActivity[];
  allTasks: RadarTask[];
  onClose: () => void;
  onDone: (id: string) => void;
  onAddSubTask?: (parentId: string) => void;
  onChangeParent: (taskId: string, parentId: string | null) => void;
  onFieldChange: (taskId: string, patch: RadarTaskPatch) => void;
}

function isTaskOverdue(task: RadarTask): boolean {
  if (!task.deadline || task.status === 'done') return false;
  const t = Date.parse(task.deadline);
  if (!Number.isFinite(t)) return false;
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d.getTime() < today.getTime();
}

export function SidePanel({
  task,
  activities,
  allTasks,
  onClose,
  onDone,
  onAddSubTask,
  onChangeParent,
  onFieldChange,
}: SidePanelProps) {
  const open = !!task;
  const overdue = task ? isTaskOverdue(task) : false;

  const [title, setTitle] = useState(task?.title ?? '');
  const [assignee, setAssignee] = useState(task?.assignee ?? '');
  const [notes, setNotes] = useState(task?.notes ?? '');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setAssignee(task.assignee ?? '');
      setNotes(task.notes ?? '');
    }
  }, [task?.id]);

  const save = (patch: RadarTaskPatch) => {
    if (task) onFieldChange(task.id, patch);
  };

  return (
    <aside
      style={{
        flex: open ? '0 0 320px' : '0 0 0',
        width: open ? 320 : 0,
        borderLeft: open ? '1px solid var(--line)' : 'none',
        background: 'var(--bg-soft)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'flex-basis 200ms ease, width 200ms ease',
        minHeight: 0,
      }}
    >
      {task && (
        <>
          <header
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 'var(--gap-lg)',
              borderBottom: '1px solid var(--line)',
              gap: 8,
            }}
          >
            <Mono
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--ink-mute)',
              }}
            >
              상세
            </Mono>
            <button
              onClick={onClose}
              title="닫기"
              style={{
                width: 22,
                height: 22,
                border: 'none',
                background: 'transparent',
                color: 'var(--ink-soft)',
                cursor: 'pointer',
                fontSize: 16,
                lineHeight: 1,
                borderRadius: 4,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-shade)';
                e.currentTarget.style.color = 'var(--ink)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--ink-soft)';
              }}
            >
              ×
            </button>
          </header>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: 'var(--gap-lg)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--gap-lg)',
            }}
          >
            {/* 제목 인라인 편집 */}
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => {
                const trimmed = title.trim();
                if (trimmed && trimmed !== task.title) save({ title: trimmed });
                else setTitle(task.title);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur();
                if (e.key === 'Escape') { setTitle(task.title); e.currentTarget.blur(); }
              }}
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--ink)',
                background: 'transparent',
                border: '1px solid transparent',
                borderRadius: 5,
                padding: '4px 6px',
                margin: '-4px -6px',
                width: 'calc(100% + 12px)',
                fontFamily: 'inherit',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => { e.currentTarget.style.border = '1px solid var(--line-strong)'; e.currentTarget.style.background = 'var(--bg)'; }}
              onBlurCapture={(e) => { e.currentTarget.style.border = '1px solid transparent'; e.currentTarget.style.background = 'transparent'; }}
            />

            {overdue && (
              <div
                style={{
                  background: 'var(--err-soft)',
                  border: '1px solid var(--err)',
                  borderRadius: 6,
                  padding: 8,
                  fontSize: 12,
                  color: 'var(--err)',
                  fontWeight: 500,
                }}
              >
                ⚠ 마감일이 지났습니다
              </div>
            )}

            <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* 유형 */}
              <EditRow label="유형">
                <div style={{ display: 'flex', gap: 4 }}>
                  {([true, false] as const).map((mine) => (
                    <button
                      key={String(mine)}
                      type="button"
                      onClick={() => save({ isMine: mine, assignee: mine ? null : (task.assignee ?? null) })}
                      style={{
                        padding: '3px 10px',
                        borderRadius: 999,
                        border: `1px solid ${task.isMine === mine ? 'var(--ink)' : 'var(--line)'}`,
                        background: task.isMine === mine ? 'var(--ink)' : 'transparent',
                        color: task.isMine === mine ? 'var(--on-accent)' : 'var(--ink-2)',
                        fontSize: 11,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      {mine ? '내 할 일' : '위임한 일'}
                    </button>
                  ))}
                </div>
              </EditRow>

              {/* 담당자 */}
              {!task.isMine && (
                <EditRow label="담당자">
                  <input
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    onBlur={() => {
                      const trimmed = assignee.trim() || null;
                      if (trimmed !== (task.assignee ?? null)) save({ assignee: trimmed });
                    }}
                    placeholder="이름"
                    style={fieldInputStyle}
                  />
                </EditRow>
              )}

              {/* 상태 */}
              <EditRow label="상태">
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {(Object.keys(TASK_STATUS_LABELS) as TaskStatus[]).map((s) => {
                    const tone = TASK_STATUS_TONES[s];
                    const active = task.status === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => save({ status: s })}
                        style={{
                          padding: '3px 8px',
                          borderRadius: 999,
                          border: `1px solid ${active ? TONE_COLOR[tone] : 'var(--line)'}`,
                          background: active ? TONE_BG[tone] : 'transparent',
                          color: active ? TONE_COLOR[tone] : 'var(--ink-2)',
                          fontSize: 10.5,
                          cursor: 'pointer',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: active ? 600 : 400,
                        }}
                      >
                        {TASK_STATUS_LABELS[s]}
                      </button>
                    );
                  })}
                </div>
              </EditRow>

              {/* 마감일 */}
              <EditRow label="마감일">
                <input
                  type="date"
                  value={task.deadline?.slice(0, 10) ?? ''}
                  onChange={(e) => save({ deadline: e.target.value || null })}
                  style={{ ...fieldInputStyle, colorScheme: 'dark light' }}
                />
              </EditRow>

              {/* 상위 태스크 */}
              <ParentSelector task={task} allTasks={allTasks} onChangeParent={onChangeParent} />

              {task.planTaskId && (
                <EditRow label="Plan">
                  <span style={{ fontSize: 11.5, color: 'var(--ink-mute)' }}>연결됨</span>
                </EditRow>
              )}
            </section>

            {/* 노트 */}
            <section>
              <Mono
                style={{
                  fontSize: 10,
                  color: 'var(--ink-mute)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                노트
              </Mono>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={() => {
                  const trimmed = notes.trim() || null;
                  if (trimmed !== (task.notes?.trim() ?? null)) save({ notes: trimmed });
                }}
                placeholder="메모 입력..."
                style={{
                  width: '100%',
                  minHeight: 80,
                  padding: '8px 10px',
                  background: 'var(--bg)',
                  border: '1px solid var(--line)',
                  borderRadius: 6,
                  fontSize: 12.5,
                  color: 'var(--ink-2)',
                  lineHeight: 1.5,
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--line-strong)'; }}
                onBlurCapture={(e) => { e.currentTarget.style.borderColor = 'var(--line)'; }}
              />
            </section>

            {/* 활동 */}
            <section>
              <Mono
                style={{
                  fontSize: 10,
                  color: 'var(--ink-mute)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                활동
              </Mono>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {activities.length === 0 && (
                  <div style={{ fontSize: 12, color: 'var(--ink-mute)', fontStyle: 'italic', padding: 6 }}>
                    아직 활동이 없어요
                  </div>
                )}
                {activities.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      padding: '6px 8px',
                      background: 'var(--bg)',
                      border: '1px solid var(--line)',
                      borderRadius: 5,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                    }}
                  >
                    <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>{a.message}</span>
                    <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>
                      {a.sourceType} · {a.createdAt.slice(0, 16).replace('T', ' ')}
                    </Mono>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <footer
            style={{
              padding: 'var(--gap-lg)',
              borderTop: '1px solid var(--line)',
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            {task.status !== 'done' && onAddSubTask && (
              <button
                onClick={() => onAddSubTask(task.id)}
                style={ghostBtnStyle}
              >
                + 서브태스크
              </button>
            )}
            <button
              onClick={() => onDone(task.id)}
              disabled={task.status === 'done'}
              style={{
                flex: 1,
                padding: '7px 10px',
                background: task.status === 'done' ? 'var(--bg-shade)' : 'var(--ink)',
                color: task.status === 'done' ? 'var(--ink-mute)' : 'var(--on-accent)',
                border: 'none',
                borderRadius: 5,
                fontSize: 12,
                cursor: task.status === 'done' ? 'default' : 'pointer',
                fontFamily: 'inherit',
                fontWeight: 500,
              }}
            >
              {task.status === 'done' ? '완료됨' : '완료 처리'}
            </button>
          </footer>
        </>
      )}
    </aside>
  );
}

const TONE_COLOR: Record<string, string> = {
  mute: 'var(--ink-mute)',
  blue: 'var(--blue)',
  warn: 'var(--warn)',
  ok: 'var(--ok)',
  err: 'var(--err)',
};

const TONE_BG: Record<string, string> = {
  mute: 'var(--bg-shade)',
  blue: 'var(--blue-soft)',
  warn: 'var(--warn-soft)',
  ok: 'var(--ok-soft)',
  err: 'var(--err-soft)',
};

const fieldInputStyle: React.CSSProperties = {
  padding: '4px 8px',
  borderRadius: 5,
  border: '1px solid var(--line)',
  background: 'var(--bg-input)',
  color: 'var(--ink)',
  fontSize: 11.5,
  fontFamily: 'inherit',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

const ghostBtnStyle: React.CSSProperties = {
  flex: '1 1 100%',
  padding: '7px 10px',
  background: 'transparent',
  border: '1px solid var(--line-strong)',
  color: 'var(--ink)',
  borderRadius: 5,
  fontSize: 12,
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontWeight: 500,
};

function EditRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
      <span style={{ color: 'var(--ink-mute)', flexShrink: 0, width: 52 }}>{label}</span>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}

function ParentSelector({
  task,
  allTasks,
  onChangeParent,
}: {
  task: RadarTask;
  allTasks: RadarTask[];
  onChangeParent: (taskId: string, parentId: string | null) => void;
}) {
  const candidates = allTasks.filter(
    (t) =>
      t.id !== task.id &&
      t.goalId === task.goalId &&
      !isDescendantOf(t.id, task.id, allTasks),
  );
  return (
    <EditRow label="상위">
      <div style={{ position: 'relative' }}>
        <select
          value={task.parentTaskId ?? ''}
          onChange={(e) => onChangeParent(task.id, e.target.value || null)}
          onClick={(e) => e.stopPropagation()}
          style={{
            ...fieldInputStyle,
            paddingRight: 24,
            appearance: 'none',
            WebkitAppearance: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="">(최상위)</option>
          {candidates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
        <span
          style={{
            position: 'absolute',
            right: 7,
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            color: 'var(--ink-mute)',
            fontSize: 9,
          }}
        >
          ▾
        </span>
      </div>
    </EditRow>
  );
}
