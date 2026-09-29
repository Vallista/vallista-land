import { useState, type CSSProperties, type FormEvent } from 'react';
import type { Goal, GoalInput, GoalStatus, GoalType } from './types';
import { GOAL_COLORS, GOAL_STATUS_LABELS, GOAL_TYPE_LABELS } from './types';

interface GoalFormProps {
  goal?: Goal;
  onSave: (input: GoalInput) => void;
  onClose: () => void;
  onDelete?: () => void;
}

interface SourceDraft {
  slackChannels: string;    // 쉼표 구분 (fe-platform, fe-arch)
  gitlabProjects: string;   // 쉼표 구분 (group/project, ...)
  jiraUrls: string;         // 쉼표 구분
  confluenceUrls: string;   // 쉼표 구분
}

function goalToSourceDraft(goal?: Goal): SourceDraft {
  if (!goal) {
    return { slackChannels: '', gitlabProjects: '', jiraUrls: '', confluenceUrls: '' };
  }
  return {
    slackChannels: goal.slackChannels.join(', '),
    gitlabProjects: goal.gitlabProjects.join(', '),
    jiraUrls: goal.jiraUrls.join(', '),
    confluenceUrls: goal.confluenceUrls.join(', '),
  };
}

function splitTrimmed(s: string): string[] {
  return s
    .split(',')
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

export function GoalForm({ goal, onSave, onClose, onDelete }: GoalFormProps) {
  const [title, setTitle] = useState(goal?.title ?? '');
  const [goalType, setGoalType] = useState<GoalType>(goal?.goalType ?? 'personal');
  const [startDate, setStartDate] = useState<string>(goal?.startDate?.slice(0, 10) ?? '');
  const [deadline, setDeadline] = useState<string>(goal?.deadline?.slice(0, 10) ?? '');
  const [color, setColor] = useState<string>(goal?.color ?? GOAL_COLORS[0]?.value ?? '#60a5fa');
  const [status, setStatus] = useState<GoalStatus>(goal?.status ?? 'on_track');
  const [draft, setDraft] = useState<SourceDraft>(() => goalToSourceDraft(goal));
  const [confirmDelete, setConfirmDelete] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const input: GoalInput = {
      id: goal?.id ?? `goal_${Date.now()}`,
      title: title.trim(),
      goalType,
      startDate: startDate || undefined,
      deadline: deadline || undefined,
      color,
      status,
      slackChannels: splitTrimmed(draft.slackChannels),
      gitlabProjects: splitTrimmed(draft.gitlabProjects),
      jiraUrls: splitTrimmed(draft.jiraUrls),
      confluenceUrls: splitTrimmed(draft.confluenceUrls),
      folder: goal?.folder,
    };
    onSave(input);
  };

  return (
    <ModalShell onClose={onClose} title={goal ? '목표 편집' : '새 목표'}>
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="제목">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="목표 이름"
            style={inputStyle}
            required
          />
        </Field>

        <Field label="유형">
          <div style={{ display: 'flex', gap: 6 }}>
            {(Object.keys(GOAL_TYPE_LABELS) as GoalType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setGoalType(t)}
                style={pillStyle(goalType === t)}
              >
                {GOAL_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </Field>

        <Field label="상태">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(Object.keys(GOAL_STATUS_LABELS) as GoalStatus[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                style={pillStyle(status === s)}
              >
                {GOAL_STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </Field>

        <Field label="시작일">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field label="마감일">
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field label="색상">
          <div style={{ display: 'flex', gap: 8 }}>
            {GOAL_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                title={c.label}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 999,
                  background: c.value,
                  border:
                    color === c.value
                      ? '2px solid var(--ink)'
                      : '2px solid transparent',
                  cursor: 'pointer',
                  padding: 0,
                }}
              />
            ))}
          </div>
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
            소스 (선택)
          </legend>
          <Field label="Slack 채널" hint="쉼표로 복수 입력. 예: fe-platform, fe-arch">
            <input
              value={draft.slackChannels}
              onChange={(e) => setDraft({ ...draft, slackChannels: e.target.value })}
              placeholder="fe-platform, fe-arch"
              style={inputStyle}
            />
          </Field>
          <Field label="GitLab 프로젝트" hint="group/project 형식. 쉼표로 복수 입력">
            <input
              value={draft.gitlabProjects}
              onChange={(e) => setDraft({ ...draft, gitlabProjects: e.target.value })}
              placeholder="my-group/my-project"
              style={inputStyle}
            />
          </Field>
          <Field label="Jira URL" hint="쉼표로 복수 입력">
            <input
              value={draft.jiraUrls}
              onChange={(e) => setDraft({ ...draft, jiraUrls: e.target.value })}
              placeholder="https://jira.../browse/PROJ-123"
              style={inputStyle}
            />
          </Field>
          <Field label="Confluence URL" hint="쉼표로 복수 입력">
            <input
              value={draft.confluenceUrls}
              onChange={(e) => setDraft({ ...draft, confluenceUrls: e.target.value })}
              placeholder="https://.../pages/12345"
              style={inputStyle}
            />
          </Field>
        </fieldset>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
          {goal && onDelete && (
            confirmDelete ? (
              <>
                <span style={{ fontSize: 12, color: 'var(--tone-err)', marginRight: 2 }}>
                  목표와 연관 할 일을 모두 삭제할까요?
                </span>
                <button
                  type="button"
                  onClick={() => { onDelete(); onClose(); }}
                  style={{ ...ghostBtnStyle, color: 'var(--tone-err)', borderColor: 'var(--tone-err)' }}
                >
                  삭제
                </button>
                <button type="button" onClick={() => setConfirmDelete(false)} style={ghostBtnStyle}>
                  취소
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                style={{ ...ghostBtnStyle, color: 'var(--tone-err)', borderColor: 'transparent' }}
              >
                삭제
              </button>
            )
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button type="button" onClick={onClose} style={ghostBtnStyle}>
              취소
            </button>
            <button type="submit" style={primaryBtnStyle}>
              저장
            </button>
          </div>
        </div>
      </form>
    </ModalShell>
  );
}

export function ModalShell({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg)',
          border: '1px solid var(--line)',
          borderRadius: 10,
          boxShadow: '0 24px 56px rgba(0,0,0,0.55)',
          width: '100%',
          maxWidth: 480,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid var(--line)',
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--ink)',
            }}
          >
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 26,
              height: 26,
              border: 'none',
              background: 'transparent',
              color: 'var(--ink-soft)',
              cursor: 'pointer',
              fontSize: 18,
              borderRadius: 4,
              lineHeight: 1,
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
        <div style={{ padding: 16, overflowY: 'auto' }}>{children}</div>
      </div>
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
        {hint && (
          <span
            style={{
              marginLeft: 6,
              fontSize: 10,
              color: 'var(--ink-faint)',
              textTransform: 'none',
              letterSpacing: 0,
            }}
          >
            {hint}
          </span>
        )}
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

export function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 3000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg)',
          border: '1px solid var(--line)',
          borderRadius: 10,
          boxShadow: '0 24px 56px rgba(0,0,0,0.55)',
          width: 280,
          padding: '20px 20px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.5 }}>
          {message}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            type="button"
            onClick={onCancel}
            style={ghostBtnStyle}
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{ ...ghostBtnStyle, color: 'var(--err)', borderColor: 'var(--err)' }}
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}
