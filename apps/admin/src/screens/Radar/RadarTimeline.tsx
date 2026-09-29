import { useState, type CSSProperties } from 'react';
import type { Goal, RadarTask } from './types';
import {
  GOAL_STATUS_LABELS,
  GOAL_STATUS_TONES,
  TASK_STATUS_LABELS,
  TASK_STATUS_TONES,
} from './types';
import { Mono } from '../../components/atoms/Atoms';
import { parseTitle } from './parseTitle';

interface RadarTimelineProps {
  goals: Goal[];
  tasksByGoal: Map<string, RadarTask[]>;
  selectedGoalId: string | null;
  onSelectGoal: (id: string) => void;
  onAddGoal: () => void;
}

const TASK_ROW_H = 28;

const TONE_BG: Record<string, string> = {
  ok: 'var(--ok-soft)',
  warn: 'var(--warn-soft)',
  err: 'var(--err-soft)',
  mute: 'var(--bg-shade)',
  blue: 'var(--blue-soft)',
};

const DAY_PX = 8;
const ROW_H = 36;
const NAME_W = 180;
const HEADER_H = 32;

const TONE_COLOR: Record<string, string> = {
  ok: 'var(--ok)',
  warn: 'var(--warn)',
  err: 'var(--err)',
  mute: 'var(--ink-mute)',
};

export function RadarTimeline({
  goals,
  tasksByGoal,
  selectedGoalId,
  onSelectGoal,
  onAddGoal,
}: RadarTimelineProps) {
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const defaultStart = new Date(today);
  defaultStart.setDate(defaultStart.getDate() - 28);

  // 시작일이 defaultStart보다 이전인 goal이 있으면 grid를 왼쪽으로 확장
  const minStartMs = goals.reduce((min, g) => {
    if (!g.startDate) return min;
    const t = Date.parse(g.startDate);
    if (!Number.isFinite(t)) return min;
    return Math.min(min, t);
  }, defaultStart.getTime());
  const timelineStart = new Date(Math.min(defaultStart.getTime(), minStartMs));
  timelineStart.setHours(0, 0, 0, 0);

  const defaultEnd = today.getTime() + 84 * 86400000;
  const maxDeadlineMs = goals.reduce((max, g) => {
    if (!g.deadline) return max;
    const t = Date.parse(g.deadline);
    if (!Number.isFinite(t)) return max;
    return Math.max(max, t);
  }, defaultEnd);
  const endTime = Math.max(defaultEnd, maxDeadlineMs + 14 * 86400000);
  const endDate = new Date(endTime);
  endDate.setHours(0, 0, 0, 0);

  const totalDays = Math.round((endDate.getTime() - timelineStart.getTime()) / 86400000);
  const timelineW = totalDays * DAY_PX;
  const todayOffset = Math.round((today.getTime() - timelineStart.getTime()) / 86400000) * DAY_PX;

  const weeks: Date[] = [];
  const cur = new Date(timelineStart);
  while (cur <= endDate) {
    weeks.push(new Date(cur));
    cur.setDate(cur.getDate() + 7);
  }

  function dateToX(dateStr: string): number {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return Math.round((d.getTime() - timelineStart.getTime()) / 86400000) * DAY_PX;
  }

  const containerStyle: CSSProperties = {
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
  };

  const innerStyle: CSSProperties = {
    display: 'flex',
    minWidth: NAME_W + timelineW + 24,
  };

  const wrapStyle: CSSProperties = {
    flex: '0 0 auto',
    width: NAME_W + timelineW + 24,
  };

  const headerRowStyle: CSSProperties = {
    display: 'flex',
    height: HEADER_H,
    borderBottom: '1px solid var(--line)',
    position: 'relative',
    marginLeft: NAME_W,
  };

  return (
    <div style={containerStyle}>
      {/* Toolbar */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 12px',
          background: 'var(--bg)',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>← 좌우 스크롤</Mono>
        <button
          onClick={onAddGoal}
          style={{
            position: 'sticky',
            right: 12,
            background: 'var(--ink)',
            color: 'var(--on-accent)',
            border: 'none',
            borderRadius: 5,
            fontSize: 11.5,
            padding: '4px 10px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontWeight: 500,
          }}
        >
          + 목표
        </button>
      </div>
      <div style={innerStyle}>
        <div style={wrapStyle}>
          {/* Header */}
          <div style={headerRowStyle}>
            {weeks.map((w, i) => {
              const x = Math.round((w.getTime() - timelineStart.getTime()) / 86400000) * DAY_PX;
              const label = `${w.getMonth() + 1}/${w.getDate()}`;
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: x,
                    top: 0,
                    height: '100%',
                    borderLeft: '1px solid var(--line)',
                    paddingLeft: 4,
                  }}
                >
                  <Mono
                    style={{
                      fontSize: 9.5,
                      color: 'var(--ink-mute)',
                      lineHeight: `${HEADER_H}px`,
                    }}
                  >
                    {label}
                  </Mono>
                </div>
              );
            })}
            {/* today line in header */}
            <div
              style={{
                position: 'absolute',
                left: todayOffset,
                top: 0,
                bottom: 0,
                width: 1,
                background: 'var(--err)',
                opacity: 0.7,
              }}
            />
          </div>

          {/* Goal rows */}
          {goals.map((goal) => {
            const tasks = tasksByGoal.get(goal.id) ?? [];
            const isSelected = selectedGoalId === goal.id;
            const statusTone = GOAL_STATUS_TONES[goal.status] ?? 'mute';
            const toneColor = TONE_COLOR[statusTone] ?? 'var(--ink-mute)';

            let barStart = 0;
            let barEnd = 0;
            let hasDeadline = false;
            if (goal.deadline) {
              hasDeadline = true;
              // 시작일이 있으면 startDate, 없으면 오늘 기준
              const rawStart = goal.startDate ?? new Date().toISOString().slice(0, 10);
              barStart = Math.max(0, dateToX(rawStart));
              barEnd = Math.min(timelineW, dateToX(goal.deadline));
            }
            const barW = Math.max(0, barEnd - barStart);

            const rowStyle: CSSProperties = {
              display: 'flex',
              alignItems: 'center',
              height: ROW_H,
              borderBottom: '1px solid var(--line)',
              cursor: 'pointer',
              background: isSelected ? 'var(--bg-shade)' : 'transparent',
              transition: 'background 120ms',
            };

            const nameColStyle: CSSProperties = {
              flex: `0 0 ${NAME_W}px`,
              width: NAME_W,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '0 10px',
              borderRight: '1px solid var(--line)',
              overflow: 'hidden',
            };

            const timelineColStyle: CSSProperties = {
              flex: 1,
              position: 'relative',
              height: '100%',
              overflow: 'hidden',
            };

            const isExpanded = expandedGoalId === goal.id;

            return (
              <div key={goal.id}>
              <div
                onClick={() => {
                  onSelectGoal(goal.id);
                  setExpandedGoalId((prev) => (prev === goal.id ? null : goal.id));
                }}
                style={rowStyle}
              >
                {/* Name column */}
                <div style={nameColStyle}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      background: goal.color,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      flex: 1,
                      fontSize: 12,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: 'var(--ink)',
                    }}
                  >
                    {goal.title}
                  </span>
                  <Mono style={{ fontSize: 9, color: toneColor, flexShrink: 0 }}>
                    {GOAL_STATUS_LABELS[goal.status]}
                  </Mono>
                </div>

                {/* Timeline column */}
                <div style={timelineColStyle}>
                  {/* today line */}
                  <div
                    style={{
                      position: 'absolute',
                      left: todayOffset,
                      top: 0,
                      bottom: 0,
                      width: 1,
                      background: 'var(--err)',
                      opacity: 0.5,
                    }}
                  />

                  {/* bar */}
                  {hasDeadline && barW > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        left: barStart,
                        width: barW,
                        height: 10,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        borderRadius: 5,
                        background: goal.color,
                        opacity: 0.75,
                      }}
                    />
                  )}

                  {/* no deadline: dotted outline */}
                  {!hasDeadline && (
                    <div
                      style={{
                        position: 'absolute',
                        left: todayOffset,
                        width: 60,
                        height: 10,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        borderRadius: 5,
                        border: `1px dashed ${goal.color}`,
                        opacity: 0.5,
                      }}
                    />
                  )}

                  {/* deadline diamond */}
                  {hasDeadline && (
                    <div
                      style={{
                        position: 'absolute',
                        left: barEnd - 4,
                        top: '50%',
                        transform: 'translateY(-50%) rotate(45deg)',
                        width: 8,
                        height: 8,
                        background: goal.color,
                      }}
                    />
                  )}

                  {/* task dots */}
                  {tasks
                    .filter((t) => t.deadline)
                    .map((t) => {
                      const tx = dateToX(t.deadline!);
                      if (tx < 0 || tx > timelineW) return null;
                      return (
                        <div
                          key={t.id}
                          style={{
                            position: 'absolute',
                            left: tx - 3,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: 6,
                            height: 6,
                            borderRadius: 999,
                            background: t.status === 'done' ? 'var(--ok)' : 'var(--ink-mute)',
                            border: '1px solid var(--bg)',
                          }}
                        />
                      );
                    })}
                </div>
              </div>
              {isExpanded && (
                <TaskRows
                  tasks={tasks}
                  dateToX={dateToX}
                  timelineW={timelineW}
                  todayOffset={todayOffset}
                />
              )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TaskRows({
  tasks,
  dateToX,
  timelineW,
  todayOffset,
}: {
  tasks: RadarTask[];
  dateToX: (s: string) => number;
  timelineW: number;
  todayOffset: number;
}) {
  if (tasks.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          height: TASK_ROW_H,
          borderBottom: '1px solid var(--line)',
          background: 'var(--bg-soft)',
          paddingLeft: NAME_W + 12,
          color: 'var(--ink-mute)',
          fontSize: 11,
          fontStyle: 'italic',
        }}
      >
        (할 일 없음)
      </div>
    );
  }

  return (
    <>
      {tasks.map((t) => {
        const { displayTitle } = parseTitle(t.title);
        const tone = TASK_STATUS_TONES[t.status];
        const tx = t.deadline ? dateToX(t.deadline) : null;
        const inRange = tx !== null && tx >= 0 && tx <= timelineW;
        return (
          <div
            key={t.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              height: TASK_ROW_H,
              borderBottom: '1px solid var(--line)',
              background: 'var(--bg-soft)',
            }}
          >
            <div
              style={{
                flex: `0 0 ${NAME_W}px`,
                width: NAME_W,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '0 10px 0 24px',
                borderRight: '1px solid var(--line)',
                overflow: 'hidden',
              }}
            >
              <span
                style={{
                  flex: 1,
                  fontSize: 11.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: 'var(--ink-2)',
                }}
              >
                {displayTitle}
              </span>
              <Mono
                style={{
                  fontSize: 9,
                  background: TONE_BG[tone],
                  color: 'var(--ink-2)',
                  padding: '1px 5px',
                  borderRadius: 3,
                  flexShrink: 0,
                }}
              >
                {TASK_STATUS_LABELS[t.status]}
              </Mono>
              {t.deadline && (
                <Mono style={{ fontSize: 9.5, color: 'var(--ink-mute)', flexShrink: 0 }}>
                  {fmtMD(t.deadline)}
                </Mono>
              )}
            </div>
            <div
              style={{
                flex: 1,
                position: 'relative',
                height: '100%',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: todayOffset,
                  top: 0,
                  bottom: 0,
                  width: 1,
                  background: 'var(--err)',
                  opacity: 0.3,
                }}
              />
              {inRange && tx !== null && (
                <div
                  style={{
                    position: 'absolute',
                    left: tx - 3,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 6,
                    height: 6,
                    borderRadius: 999,
                    background: t.status === 'done' ? 'var(--ok)' : 'var(--ink-mute)',
                    border: '1px solid var(--bg)',
                  }}
                />
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}

function fmtMD(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return iso.slice(5, 10);
  const d = new Date(t);
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}
