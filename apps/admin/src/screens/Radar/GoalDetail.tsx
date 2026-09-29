import { useEffect, useRef, useState } from 'react';
import { Mono } from '../../components/atoms/Atoms';
import type { Goal, GoalStatus, RadarActivity, RadarTask } from './types';
import { GOAL_STATUS_LABELS, GOAL_STATUS_TONES } from './types';

interface GoalDetailProps {
  goal: Goal;
  tasks: RadarTask[];
  activities: RadarActivity[];
  onDismissAlert: (id: string) => void;
  onEditGoal: () => void;
  onAddSuggestion: (activity: RadarActivity) => void;
  onSync: (goalId: string) => void;
  onStatusChange: (status: GoalStatus) => void;
}

const STATUS_COLORS: Record<'ok' | 'warn' | 'err' | 'mute', string> = {
  ok: 'var(--ok)',
  warn: 'var(--warn)',
  err: 'var(--err)',
  mute: 'var(--ink-mute)',
};

const STATUS_BG: Record<'ok' | 'warn' | 'err' | 'mute', string> = {
  ok: 'var(--ok-soft)',
  warn: 'var(--warn-soft)',
  err: 'var(--err-soft)',
  mute: 'var(--bg-shade)',
};

export function GoalDetail({
  goal,
  tasks,
  activities,
  onDismissAlert,
  onEditGoal,
  onAddSuggestion,
  onSync,
  onStatusChange,
}: GoalDetailProps) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === 'done').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const inReview = tasks.filter((t) => t.status === 'in_review').length;
  const notStarted = tasks.filter((t) => t.status === 'not_started').length;
  const blocked = tasks.filter((t) => t.status === 'blocked').length;
  const mineCount = tasks.filter((t) => t.isMine).length;
  const delegatedCount = tasks.filter((t) => !t.isMine).length;
  const donePct = total === 0 ? 0 : Math.round((done / total) * 100);

  const tone = GOAL_STATUS_TONES[goal.status];
  const dday = computeDdayText(goal.deadline);

  const alert = activities
    .filter((a) => a.isAlert && !a.alertDismissed)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

  return (
    <div
      style={{
        padding: 'var(--gap-lg) calc(var(--gap-lg) + 6px) var(--gap)',
        borderBottom: '1px solid var(--line)',
        background: 'var(--bg)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <GoalStatusDropdown goal={goal} tone={tone} onStatusChange={onStatusChange} />
        <span style={{ flex: 1 }} />
        <button
          onClick={() => onSync(goal.id)}
          title="소스 싱크"
          style={{
            background: 'transparent',
            border: '1px solid var(--line)',
            color: 'var(--ink-soft)',
            borderRadius: 4,
            fontSize: 11,
            padding: '3px 8px',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--line-strong)';
            e.currentTarget.style.color = 'var(--ink)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--line)';
            e.currentTarget.style.color = 'var(--ink-soft)';
          }}
        >
          싱크
        </button>
        <button
          onClick={onEditGoal}
          title="목표 편집"
          style={{
            background: 'transparent',
            border: '1px solid var(--line)',
            color: 'var(--ink-soft)',
            borderRadius: 4,
            fontSize: 11,
            padding: '3px 8px',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--line-strong)';
            e.currentTarget.style.color = 'var(--ink)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--line)';
            e.currentTarget.style.color = 'var(--ink-soft)';
          }}
        >
          편집
        </button>
      </div>
      <h2
        style={{
          margin: 0,
          fontSize: 20,
          fontWeight: 700,
          color: 'var(--ink)',
          letterSpacing: '-0.2px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            background: goal.color,
            flex: '0 0 10px',
          }}
        />
        {goal.title}
      </h2>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          marginTop: 6,
          color: 'var(--ink-mute)',
          fontSize: 12,
        }}
      >
        {goal.startDate && (
          <Mono style={{ fontSize: 11, color: 'var(--ink-soft)' }}>
            시작 {goal.startDate.slice(0, 10)}
          </Mono>
        )}
        {dday && <Mono style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{dday}</Mono>}
        <span>
          나: <Mono style={{ color: 'var(--blue)' }}>{mineCount}건</Mono> · 위임:{' '}
          <Mono style={{ color: 'var(--ink-2)' }}>{delegatedCount}건</Mono>
        </span>
        <span>
          완료 <Mono style={{ color: 'var(--ink-2)' }}>{done}/{total}</Mono>
        </span>
      </div>

      {(goal.slackChannels.length > 0 ||
        goal.gitlabProjects.length > 0 ||
        goal.jiraUrls.length > 0 ||
        goal.confluenceUrls.length > 0) && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
          {goal.slackChannels.map((ch) => (
            <SourceChip key={`slack-${ch}`} icon="💬" label={ch} />
          ))}
          {goal.gitlabProjects.map((p) => (
            <SourceChip key={`gitlab-${p}`} icon="🦊" label={p.split('/').pop() ?? p} />
          ))}
          {goal.jiraUrls.map((_u, i) => (
            <SourceChip key={`jira-${i}`} icon="🎯" label="Jira" />
          ))}
          {goal.confluenceUrls.map((_u, i) => (
            <SourceChip key={`wiki-${i}`} icon="📄" label="Wiki" />
          ))}
        </div>
      )}

      {total > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 6,
            marginTop: 8,
            flexWrap: 'wrap',
          }}
        >
          <MetricPill label={`완료 ${donePct}%`} tone="ok" />
          <MetricPill label={`진행중 ${inProgress}`} tone="blue" />
          <MetricPill label={`리뷰중 ${inReview}`} tone="warn" />
          <MetricPill label={`블록 ${blocked}`} tone="err" />
          <MetricPill label={`대기 ${notStarted}`} tone="mute" />
        </div>
      )}

      <div style={{ marginTop: 10 }}>
        <SegmentBar
          done={done}
          inProgress={inProgress}
          inReview={inReview}
          blocked={blocked}
          notStarted={notStarted}
        />
      </div>

      {alert && (
        <div
          style={{
            marginTop: 10,
            padding: '8px 10px',
            borderRadius: 6,
            background: alert.suggestedTaskTitle ? 'var(--blue-soft)' : 'var(--warn-soft)',
            border: alert.suggestedTaskTitle
              ? '1px solid rgba(96,165,250,0.3)'
              : '1px solid rgba(251,191,36,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12,
            color: 'var(--ink-2)',
          }}
        >
          <span style={{ color: alert.suggestedTaskTitle ? 'var(--blue)' : 'var(--warn)', fontSize: 13 }}>
            {alert.suggestedTaskTitle ? '→' : '⚠'}
          </span>
          <span style={{ flex: 1 }}>{alert.message}</span>
          {alert.suggestedTaskTitle ? (
            <>
              <button
                onClick={() => onAddSuggestion(alert)}
                style={{
                  background: 'var(--ink)',
                  border: 'none',
                  color: 'var(--on-accent)',
                  borderRadius: 4,
                  fontSize: 11,
                  padding: '3px 10px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                }}
              >
                Plan에 추가
              </button>
              <button
                onClick={() => onDismissAlert(alert.id)}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--line-strong)',
                  color: 'var(--ink-soft)',
                  borderRadius: 4,
                  fontSize: 11,
                  padding: '3px 8px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                무시
              </button>
            </>
          ) : (
            <button
              onClick={() => onDismissAlert(alert.id)}
              style={{
                background: 'transparent',
                border: '1px solid var(--line-strong)',
                color: 'var(--ink-soft)',
                borderRadius: 4,
                fontSize: 11,
                padding: '2px 8px',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              확인
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function SourceChip({ icon, label }: { icon: string; label: string }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontFamily: 'var(--font-mono)',
        color: 'var(--ink-mute)',
        background: 'var(--bg-shade)',
        border: '1px solid var(--line)',
        borderRadius: 4,
        padding: '1px 6px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
      }}
    >
      {icon} {label}
    </span>
  );
}

function MetricPill({ label, tone }: { label: string; tone: 'ok' | 'warn' | 'err' | 'mute' | 'blue' }) {
  const colorMap: Record<string, string> = {
    ok: 'var(--ok)',
    warn: 'var(--warn)',
    err: 'var(--err)',
    mute: 'var(--ink-mute)',
    blue: 'var(--blue)',
  };
  const bgMap: Record<string, string> = {
    ok: 'var(--ok-soft)',
    warn: 'var(--warn-soft)',
    err: 'var(--err-soft)',
    mute: 'var(--bg-shade)',
    blue: 'var(--blue-soft)',
  };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 7px',
        borderRadius: 999,
        fontSize: 10,
        fontFamily: 'var(--font-mono)',
        fontWeight: 600,
        letterSpacing: '0.02em',
        color: colorMap[tone],
        background: bgMap[tone],
      }}
    >
      {label}
    </span>
  );
}

function SegmentBar({
  done,
  inProgress,
  inReview,
  blocked,
  notStarted,
}: {
  done: number;
  inProgress: number;
  inReview: number;
  blocked: number;
  notStarted: number;
}) {
  const total = done + inProgress + inReview + blocked + notStarted;
  if (total === 0) {
    return (
      <div
        style={{
          height: 6,
          background: 'var(--line)',
          borderRadius: 999,
        }}
      />
    );
  }
  const segments = [
    { value: done, color: 'var(--ok)' },
    { value: inProgress, color: 'var(--blue)' },
    { value: inReview, color: 'var(--warn)' },
    { value: blocked, color: 'var(--err)' },
    { value: notStarted, color: 'var(--line-strong)' },
  ];
  return (
    <div
      style={{
        display: 'flex',
        height: 6,
        background: 'var(--line)',
        borderRadius: 999,
        overflow: 'hidden',
        gap: 2,
      }}
    >
      {segments.map((seg, i) =>
        seg.value > 0 ? (
          <div
            key={i}
            style={{
              flex: seg.value,
              background: seg.color,
            }}
          />
        ) : null,
      )}
    </div>
  );
}

function computeDdayText(deadline?: string): string | null {
  if (!deadline) return null;
  const t = Date.parse(deadline);
  if (!Number.isFinite(t)) return null;
  const date = new Date(t);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diff = Math.round((target - today) / 86400000);
  const tag =
    diff === 0 ? 'D-Day' : diff > 0 ? `D-${diff}` : `D+${Math.abs(diff)}`;
  return `마감 ${y}-${m}-${d} · ${tag}`;
}

function GoalStatusDropdown({
  goal,
  tone,
  onStatusChange,
}: {
  goal: Goal;
  tone: 'ok' | 'warn' | 'err' | 'mute';
  onStatusChange: (status: GoalStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!open) {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (rect) {
        setMenuPos({ top: rect.bottom + 4, left: rect.left });
      }
    }
    setOpen((v) => !v);
  };

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        title="상태 변경"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '2px 8px',
          borderRadius: 999,
          border: 'none',
          fontSize: 10.5,
          fontWeight: 600,
          color: STATUS_COLORS[tone],
          background: STATUS_BG[tone],
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          cursor: 'pointer',
        }}
      >
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: 999,
            background: STATUS_COLORS[tone],
          }}
        />
        {GOAL_STATUS_LABELS[goal.status]}
      </button>
      {open && (
        <div
          style={{
            position: 'fixed',
            top: menuPos?.top ?? 0,
            left: menuPos?.left ?? 0,
            zIndex: 200,
            background: 'var(--bg)',
            border: '1px solid var(--line-strong)',
            borderRadius: 7,
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            padding: '4px',
            minWidth: 110,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {(Object.keys(GOAL_STATUS_LABELS) as GoalStatus[]).map((s) => {
            const t = GOAL_STATUS_TONES[s];
            const active = goal.status === s;
            return (
              <button
                key={s}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(s);
                  setOpen(false);
                }}
                style={{
                  padding: '5px 10px',
                  borderRadius: 5,
                  border: active ? `1px solid ${STATUS_COLORS[t]}` : '1px solid transparent',
                  background: active ? STATUS_BG[t] : 'transparent',
                  color: STATUS_COLORS[t],
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10.5,
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  textAlign: 'left',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = STATUS_BG[t];
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = 'transparent';
                }}
              >
                {GOAL_STATUS_LABELS[s]}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
