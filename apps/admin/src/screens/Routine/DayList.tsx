import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { Routine, RoutineSlot, RoutineTimer } from '@vallista/content-core';
import { Card, CardTitle, Mono } from '../../components/atoms/Atoms';
import { StreakIcon } from '../../components/atoms/Icons';
import {
  addDays,
  describeSchedule,
  fmtClock,
  fmtSecs,
  isActiveOn,
  isScheduled,
  logOf,
  routineStreak,
  type DayKey,
  type LogIndex,
} from '../../lib/routineStats';
import {
  ROUTINE_TEMPLATES,
  SLOT_META,
  SLOT_ORDER,
  routineColor,
  type RoutineTemplate,
} from './meta';
import { dateLabel } from './HoverTip';

interface Props {
  routines: Routine[];
  idx: LogIndex;
  date: DayKey;
  today: DayKey;
  minDate: DayKey;
  timer: RoutineTimer | null;
  elapsed: number;
  busyId: string | null;
  onDate: (k: DayKey) => void;
  onToggle: (r: Routine, done: boolean) => void;
  onTimer: (r: Routine) => void;
  onStopTimer: () => void;
  onMinutes: (r: Routine, minutes: number) => void;
  onAdd: (template?: RoutineTemplate) => void;
  onManage: () => void;
  onEdit: (r: Routine) => void;
}

export function DayList({
  routines,
  idx,
  date,
  today,
  minDate,
  timer,
  elapsed,
  busyId,
  onDate,
  onToggle,
  onTimer,
  onStopTimer,
  onMinutes,
  onAdd,
  onManage,
  onEdit,
}: Props) {
  const [showOff, setShowOff] = useState(false);
  const isToday = date === today;
  const active = routines.filter((r) => isActiveOn(r, date));
  const scheduled = active.filter((r) => isScheduled(r, date));
  const off = active.filter((r) => !isScheduled(r, date));
  const doneCount = scheduled.filter((r) => logOf(idx, r.id, date)?.done).length;
  const groups = SLOT_ORDER.map((slot) => ({
    slot,
    items: scheduled.filter((r) => r.slot === slot),
  })).filter((g) => g.items.length > 0);
  const showSlotHeads = groups.length > 1 || (groups[0] && groups[0].slot !== 'anytime');
  const timerRoutine = timer ? routines.find((r) => r.id === timer.routineId) : undefined;

  const rowProps = (r: Routine) => ({
    routine: r,
    idx,
    date,
    today,
    timer,
    elapsed,
    busy: busyId === r.id,
    canTime: isToday && !r.archivedAt,
    onToggle,
    onTimer,
    onMinutes,
    onEdit,
  });

  return (
    <Card padded={false} style={{ height: '100%' }}>
      <div style={headStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <NavBtn
            label="‹"
            title="전날"
            disabled={date <= minDate}
            onClick={() => onDate(addDays(date, -1))}
          />
          <CardTitle
            style={{ textTransform: 'none', letterSpacing: 0, fontSize: 13, color: 'var(--ink)' }}
          >
            {isToday ? '오늘' : dateLabel(date)}
          </CardTitle>
          {isToday && (
            <Mono style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{dateLabel(date)}</Mono>
          )}
          <NavBtn
            label="›"
            title="다음 날"
            disabled={date >= today}
            onClick={() => onDate(addDays(date, 1))}
          />
          {!isToday && (
            <button onClick={() => onDate(today)} style={pillBtn}>
              오늘로
            </button>
          )}
        </div>
        <Mono style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>
          {scheduled.length > 0 ? `${doneCount}/${scheduled.length} 완료` : ''}
        </Mono>
      </div>

      {timer && timerRoutine && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 18px',
            borderBottom: '1px solid var(--line)',
            background: 'var(--blue-soft)',
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: routineColor(timerRoutine.color),
              animation: 'psm-pulse 1.2s ease-in-out infinite',
            }}
          />
          <span style={{ fontSize: 12.5, color: 'var(--ink)', flex: 1, minWidth: 0 }}>
            {timerRoutine.title}
            {timer.date !== date && (
              <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)', marginLeft: 6 }}>
                {dateLabel(timer.date)} 기록 중
              </Mono>
            )}
          </span>
          <Mono style={{ fontSize: 13, color: 'var(--ink)' }}>{fmtClock(elapsed)}</Mono>
          <button onClick={onStopTimer} style={pillBtn} title="멈추고 기록">
            ■ 멈추기
          </button>
        </div>
      )}

      {routines.length === 0 ? (
        <EmptyStart onAdd={onAdd} />
      ) : (
        <div style={{ padding: '6px 6px 10px' }}>
          {scheduled.length === 0 && (
            <div style={{ padding: '18px 14px', fontSize: 12.5, color: 'var(--ink-mute)' }}>
              {date < minDate ? '이 날은 루틴을 시작하기 전이에요.' : '이 날 예정된 루틴이 없어요.'}
            </div>
          )}
          {groups.map((g) => (
            <div key={g.slot}>
              {showSlotHeads && <SlotHead slot={g.slot} count={g.items.length} />}
              {g.items.map((r) => (
                <DayRow key={r.id} {...rowProps(r)} />
              ))}
            </div>
          ))}
          {off.length > 0 && (
            <div style={{ marginTop: 4 }}>
              <button onClick={() => setShowOff((v) => !v)} style={offToggle}>
                {showOff ? '▾' : '▸'} 이 날 쉬는 루틴 · {off.length}
                <span style={{ color: 'var(--ink-faint)' }}> — 해도 스트릭에는 안 들어가요</span>
              </button>
              {showOff && off.map((r) => <DayRow key={r.id} {...rowProps(r)} dim />)}
            </div>
          )}
        </div>
      )}

      {routines.length > 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '10px 18px',
            borderTop: '1px solid var(--line)',
          }}
        >
          <button onClick={() => onAdd()} style={pillBtn}>
            + 루틴
          </button>
          <button onClick={onManage} style={{ ...pillBtn, border: 'none' }}>
            루틴 관리
          </button>
        </div>
      )}
    </Card>
  );
}

function DayRow({
  routine: r,
  idx,
  date,
  today,
  timer,
  elapsed,
  busy,
  canTime,
  dim,
  onToggle,
  onTimer,
  onMinutes,
  onEdit,
}: {
  routine: Routine;
  idx: LogIndex;
  date: DayKey;
  today: DayKey;
  timer: RoutineTimer | null;
  elapsed: number;
  busy: boolean;
  canTime: boolean;
  dim?: boolean;
  onToggle: (r: Routine, done: boolean) => void;
  onTimer: (r: Routine) => void;
  onMinutes: (r: Routine, minutes: number) => void;
  onEdit: (r: Routine) => void;
}) {
  const [editing, setEditing] = useState(false);
  const log = logOf(idx, r.id, date);
  const done = log?.done === true;
  const running = timer?.routineId === r.id;
  const secs = (log?.secs ?? 0) + (running && timer?.date === date ? elapsed : 0);
  const goalSecs = (r.goalMin ?? 0) * 60;
  const streak = routineStreak(r, idx, today);
  const color = routineColor(r.color);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '9px 12px',
        borderRadius: 8,
        opacity: dim ? 0.75 : 1,
        background: running ? 'var(--bg-shade)' : 'transparent',
      }}
    >
      <button
        onClick={() => onToggle(r, !done)}
        disabled={busy}
        aria-pressed={done}
        title={done ? '완료 취소' : '완료'}
        style={{
          width: 24,
          height: 24,
          flex: '0 0 24px',
          borderRadius: 999,
          border: `2px solid ${color}`,
          background: done ? color : 'transparent',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: busy ? 'wait' : 'pointer',
          padding: 0,
          transition: 'background 140ms',
        }}
      >
        {done && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path
              d="M2.5 6.3 5 8.6 9.6 3.6"
              stroke="var(--bg)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <button
          onClick={() => onEdit(r)}
          title="루틴 편집"
          style={{
            border: 'none',
            background: 'transparent',
            padding: 0,
            cursor: 'pointer',
            fontFamily: 'inherit',
            textAlign: 'left',
            fontSize: 13.5,
            color: done ? 'var(--ink-soft)' : 'var(--ink)',
            textDecorationLine: done ? 'line-through' : 'none',
            textDecorationColor: 'var(--ink-faint)',
            maxWidth: '100%',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'block',
          }}
        >
          {r.title}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
          <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)' }}>
            {describeSchedule(r)}
            {r.goalMin ? ` · 목표 ${r.goalMin}분` : ''}
          </Mono>
          {streak.current > 0 && (
            <Mono
              title={`현재 ${streak.current}일 연속 · 최고 ${streak.best}일`}
              style={{
                fontSize: 10.5,
                color: 'var(--ink-2)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
              }}
            >
              <span style={{ color: 'var(--ok)', display: 'inline-flex' }}>
                <StreakIcon size={10} />
              </span>
              {streak.current}일 연속
            </Mono>
          )}
        </div>
      </div>

      {editing ? (
        <MinutesEditor
          initial={Math.floor((log?.secs ?? 0) / 60)}
          onCancel={() => setEditing(false)}
          onSave={(m) => {
            setEditing(false);
            onMinutes(r, m);
          }}
        />
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {(goalSecs > 0 || secs > 0) && (
            <button
              onClick={() => setEditing(true)}
              title="기록 시간 직접 고치기"
              style={{
                border: 'none',
                background: 'transparent',
                padding: '2px 4px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: 4,
                fontFamily: 'inherit',
              }}
            >
              <Mono style={{ fontSize: 11, color: 'var(--ink-2)' }}>
                {running && timer?.date === date ? fmtClock(secs) : fmtSecs(secs)}
                {goalSecs > 0 && <span style={{ color: 'var(--ink-mute)' }}> / {r.goalMin}분</span>}
              </Mono>
              {goalSecs > 0 && <Meter ratio={secs / goalSecs} />}
            </button>
          )}
          {canTime && (
            <button
              onClick={() => onTimer(r)}
              disabled={busy}
              title={running ? '멈추고 기록' : '타이머 시작'}
              aria-pressed={running}
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                border: `1px solid ${running ? 'var(--blue)' : 'var(--line)'}`,
                background: running ? 'var(--blue-soft)' : 'var(--bg)',
                color: running ? 'var(--blue)' : 'var(--ink-soft)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              {running ? (
                <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
                  <rect x="1.5" y="1.5" width="7" height="7" rx="1.2" fill="currentColor" />
                </svg>
              ) : (
                <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
                  <path d="M2.5 1.4v7.2L8.6 5z" fill="currentColor" />
                </svg>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function MinutesEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial: number;
  onSave: (m: number) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(String(initial));
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.select();
  }, []);
  const save = () => {
    const n = Number.parseInt(value, 10);
    onSave(Number.isFinite(n) ? Math.min(Math.max(n, 0), 1440) : 0);
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <input
        ref={ref}
        type="number"
        min={0}
        max={1440}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save();
          if (e.key === 'Escape') onCancel();
        }}
        style={{
          width: 64,
          padding: '4px 6px',
          border: '1px solid var(--line-strong)',
          borderRadius: 5,
          background: 'var(--bg-input)',
          color: 'var(--ink)',
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          outline: 'none',
        }}
      />
      <Mono style={{ fontSize: 11, color: 'var(--ink-mute)' }}>분</Mono>
      <button onClick={save} style={pillBtn}>
        저장
      </button>
      <button onClick={onCancel} style={{ ...pillBtn, border: 'none' }}>
        취소
      </button>
    </div>
  );
}

export function Meter({ ratio, width = 72 }: { ratio: number; width?: number }) {
  const r = Math.max(0, Math.min(1, Number.isFinite(ratio) ? ratio : 0));
  return (
    <span
      style={{
        display: 'block',
        width,
        height: 4,
        borderRadius: 999,
        background: 'var(--blue-soft)',
        overflow: 'hidden',
      }}
    >
      <span
        style={{
          display: 'block',
          width: `${r * 100}%`,
          height: '100%',
          borderRadius: 999,
          background: r >= 1 ? 'var(--ok)' : 'var(--blue)',
        }}
      />
    </span>
  );
}

function SlotHead({ slot, count }: { slot: RoutineSlot; count: number }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 6,
        padding: '10px 12px 2px',
      }}
    >
      <Mono style={{ fontSize: 10.5, color: 'var(--ink-soft)', letterSpacing: '0.04em' }}>
        {SLOT_META[slot].label}
      </Mono>
      <Mono style={{ fontSize: 10, color: 'var(--ink-faint)' }}>{count}</Mono>
    </div>
  );
}

function EmptyStart({ onAdd }: { onAdd: (t?: RoutineTemplate) => void }) {
  return (
    <div style={{ padding: '28px 22px 26px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>
          첫 루틴을 만들어 볼까요
        </div>
        <p style={{ margin: '6px 0 0', fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
          매일 체크하면 연속 기록과 요일별 패턴, 쓴 시간을 정리해 보여드려요. 목표 시간을 정하면
          타이머로 채울 때 자동으로 완료돼요.
        </p>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {ROUTINE_TEMPLATES.map((t) => (
          <button key={t.title} onClick={() => onAdd(t)} style={pillBtn}>
            {t.title}
            {t.goalMin ? ` · ${t.goalMin}분` : ''}
          </button>
        ))}
      </div>
      <div>
        <button
          onClick={() => onAdd()}
          style={{
            ...pillBtn,
            background: 'var(--ink)',
            color: 'var(--on-accent)',
            border: '1px solid transparent',
            padding: '7px 14px',
          }}
        >
          + 직접 만들기
        </button>
      </div>
    </div>
  );
}

function NavBtn({
  label,
  title,
  disabled,
  onClick,
}: {
  label: string;
  title: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        width: 22,
        height: 22,
        border: 'none',
        borderRadius: 4,
        background: 'transparent',
        color: disabled ? 'var(--ink-faint)' : 'var(--ink-soft)',
        cursor: disabled ? 'default' : 'pointer',
        fontSize: 15,
        lineHeight: 1,
        padding: 0,
        fontFamily: 'inherit',
      }}
    >
      {label}
    </button>
  );
}

const headStyle: CSSProperties = {
  padding: '12px 18px',
  borderBottom: '1px solid var(--line)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
};

export const pillBtn: CSSProperties = {
  padding: '4px 10px',
  fontSize: 11.5,
  border: '1px solid var(--line)',
  background: 'transparent',
  color: 'var(--ink-soft)',
  borderRadius: 999,
  fontFamily: 'inherit',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const offToggle: CSSProperties = {
  border: 'none',
  background: 'transparent',
  padding: '8px 12px',
  fontSize: 11.5,
  color: 'var(--ink-mute)',
  cursor: 'pointer',
  fontFamily: 'inherit',
  textAlign: 'left',
};
