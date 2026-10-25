import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { Routine as RoutineT, RoutineLog } from '@vallista/content-core';
import { Card, CardTitle, Mono, PageHead } from '../../components/atoms/Atoms';
import { dispatchToast } from '../../components/NotifToast';
import {
  notifyRoutinesChanged,
  setRoutineCheck,
  setRoutineMinutes,
  startRoutineTimer,
  stopRoutineTimer,
  type RoutineTimerCommit,
} from '../../lib/tauri';
import {
  addDays,
  buildInsights,
  dayStat,
  daysBetween,
  fmtSecs,
  indexLogs,
  pct,
  perfectStreak,
  routineRows,
  summarize,
  weekStartKey,
  type DayKey,
  type RoutineInsight,
} from '../../lib/routineStats';
import { useWeekStartDay } from '../../lib/weekStart';
import { Breakdown } from './Breakdown';
import { DayList } from './DayList';
import { Heatmap } from './Heatmap';
import { PeriodPanel } from './PeriodPanel';
import { RoutineDialog, type DialogInit } from './RoutineDialog';
import { RoutineSyncDialog, SyncButton, useRoutineSyncStatus } from './RoutineSyncDialog';
import { RoutineTable } from './RoutineTable';
import { routineColor } from './meta';
import { useRoutineData, useTimerElapsed, useTodayKey } from './useRoutineData';

export function Routine() {
  const data = useRoutineData();
  const { routines, logs, idx, timer, loaded, error } = data;
  const today = useTodayKey();
  const weekStart = useWeekStartDay();
  const elapsed = useTimerElapsed(timer);
  const [selected, setSelected] = useState<DayKey>(today);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogInit | null>(null);
  const [syncOpen, setSyncOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useRoutineSyncStatus();
  const [busyId, setBusyId] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const dayRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1040);

  // 자정을 넘기면 '오늘'을 보고 있던 화면은 새 오늘로 따라간다
  const prevToday = useRef(today);
  useEffect(() => {
    if (prevToday.current !== today) {
      setSelected((s) => (s === prevToday.current ? today : s));
      prevToday.current = today;
    }
  }, [today]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const wide = width >= 900;
  const active = useMemo(() => routines.filter((r) => !r.archivedAt), [routines]);
  const minDate = useMemo(
    () => routines.reduce((m, r) => (r.startDate < m ? r.startDate : m), today),
    [routines, today],
  );
  const focus = focusId ? (routines.find((r) => r.id === focusId) ?? null) : null;
  useEffect(() => {
    if (focusId && !routines.some((r) => r.id === focusId)) setFocusId(null);
  }, [focusId, routines]);
  const analysisSet = useMemo(() => (focus ? [focus] : routines), [focus, routines]);

  const kpi = useMemo(() => {
    const day = dayStat(routines, idx, today, today);
    const perfect = perfectStreak(routines, idx, today);
    const ws = weekStartKey(today, weekStart);
    const span = daysBetween(ws, today);
    const week = summarize(routines, idx, ws, today, today);
    const last = summarize(routines, idx, addDays(ws, -7), addDays(ws, -7 + span), today);
    return { day, perfect, week, last, days: span + 1 };
  }, [routines, idx, today, weekStart]);

  const insights = useMemo(
    () => buildInsights(active, idx, today, weekStart),
    [active, idx, today, weekStart],
  );
  const rows = useMemo(() => routineRows(active, idx, today), [active, idx, today]);
  const liveSecs = timer && timer.date === today ? elapsed : 0;

  const withBusy = async (id: string, fn: () => Promise<void>) => {
    setBusyId(id);
    try {
      await fn();
      notifyRoutinesChanged();
    } catch {
      // invoke 래퍼가 토스트로 알린다
    } finally {
      setBusyId(null);
    }
  };

  const announceCommit = (c: RoutineTimerCommit | null | undefined) => {
    if (!c) return;
    data.mergeLog(c.log);
    const r = routines.find((x) => x.id === c.log.routineId);
    if (c.capped) {
      dispatchToast({
        title: '타이머를 12시간까지만 기록했어요',
        body: `‘${r?.title ?? '루틴'}’ 타이머가 너무 오래 켜져 있었어요. 필요하면 시간을 직접 고쳐 주세요.`,
        duration: 0,
      });
    } else if (c.reachedGoal) {
      dispatchToast({
        title: '목표 시간 달성',
        body: `‘${r?.title ?? '루틴'}’ ${fmtSecs(c.log.secs)} — 완료로 표시했어요.`,
      });
    }
  };

  const celebrateIfDone = (log: RoutineLog) => {
    if (log.date !== today || !log.done) return;
    const nextIdx = indexLogs([
      ...logs.filter((l) => !(l.routineId === log.routineId && l.date === log.date)),
      log,
    ]);
    const s = dayStat(routines, nextIdx, today, today);
    if (s.scheduled > 0 && s.done === s.scheduled) {
      const streak = perfectStreak(routines, nextIdx, today).current;
      dispatchToast({
        id: `routine-all-done-${today}`,
        title: '오늘 루틴을 모두 끝냈어요',
        body: streak > 1 ? `모두 끝낸 날 ${streak}일 연속이에요.` : `${s.scheduled}개 모두 완료.`,
      });
    }
  };

  const onToggle = (r: RoutineT, done: boolean) =>
    void withBusy(r.id, async () => {
      const log = await setRoutineCheck(r.id, selected, done);
      data.mergeLog(log);
      celebrateIfDone(log);
    });

  const onMinutes = (r: RoutineT, minutes: number) =>
    void withBusy(r.id, async () => {
      const res = await setRoutineMinutes(r.id, selected, minutes);
      data.mergeLog(res.log);
      if (res.reachedGoal) {
        dispatchToast({ title: '목표 시간 달성', body: `‘${r.title}’ 완료로 표시했어요.` });
        celebrateIfDone(res.log);
      }
    });

  const onStopTimer = () =>
    void withBusy(timer?.routineId ?? 'timer', async () => {
      const c = await stopRoutineTimer(false);
      data.setTimer(null);
      announceCommit(c);
      if (c?.reachedGoal) celebrateIfDone(c.log);
    });

  const onTimer = (r: RoutineT) => {
    if (timer?.routineId === r.id) {
      onStopTimer();
      return;
    }
    void withBusy(r.id, async () => {
      const res = await startRoutineTimer(r.id);
      data.setTimer(res.timer);
      announceCommit(res.committed);
    });
  };

  const selectDate = (k: DayKey) => {
    setSelected(k);
    dayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const weekDelta =
    kpi.week.rate !== null && kpi.last.rate !== null && kpi.last.scheduled > 0
      ? Math.round((kpi.week.rate - kpi.last.rate) * 100)
      : null;

  const sub =
    routines.length === 0
      ? '매일 지키고 싶은 것들을 체크하고, 쌓인 기록을 돌아봐요'
      : kpi.day.scheduled > 0
        ? `오늘 ${kpi.day.done}/${kpi.day.scheduled} 완료 · 모두 끝낸 날 ${kpi.perfect.current}일 연속`
        : '오늘은 예정된 루틴이 없어요';

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--bg)' }}>
      <div
        ref={wrapRef}
        style={{ padding: 'calc(var(--gap-lg) * 2) calc(var(--gap-lg) * 3) 80px', maxWidth: 1120 }}
      >
        <PageHead
          title="루틴"
          sub={sub}
          right={
            <>
              <SyncButton status={syncStatus} onClick={() => setSyncOpen(true)} style={ghostBtn} />
              {routines.length > 0 && (
                <>
                  <button onClick={() => setDialog({ mode: 'list' })} style={ghostBtn}>
                    루틴 관리
                  </button>
                  <button onClick={() => setDialog({ mode: 'new' })} style={primaryBtn}>
                    + 루틴
                  </button>
                </>
              )}
            </>
          }
        />

        {error && (
          <div style={errorBox}>
            루틴을 불러오지 못했어요: {error}
            <div style={{ marginTop: 4, color: 'var(--ink-mute)' }}>
              앱을 최신 빌드로 다시 설치했는지 확인해 주세요 (새 Rust 커맨드가 필요해요).
            </div>
          </div>
        )}

        {!loaded ? (
          <Mono style={{ fontSize: 12, color: 'var(--ink-mute)' }}>불러오는 중…</Mono>
        ) : routines.length === 0 ? (
          <div style={{ maxWidth: 640 }}>
            <DayList
              routines={routines}
              idx={idx}
              date={selected}
              today={today}
              minDate={minDate}
              timer={timer}
              elapsed={elapsed}
              busyId={busyId}
              onDate={setSelected}
              onToggle={onToggle}
              onTimer={onTimer}
              onStopTimer={onStopTimer}
              onMinutes={onMinutes}
              onAdd={(template) => setDialog({ mode: 'new', template })}
              onManage={() => setDialog({ mode: 'list' })}
              onEdit={(r) => setDialog({ mode: 'edit', id: r.id })}
            />
          </div>
        ) : (
          <>
            <div style={grid(wide ? 4 : 2)}>
              <StatTile
                label="오늘"
                value={kpi.day.scheduled > 0 ? `${kpi.day.done}/${kpi.day.scheduled}` : '–'}
                note={
                  kpi.day.scheduled === 0
                    ? '예정 없음'
                    : kpi.day.done === kpi.day.scheduled
                      ? '모두 끝냈어요'
                      : `${kpi.day.scheduled - kpi.day.done}개 남음`
                }
                meter={kpi.day.rate}
              />
              <StatTile
                label="모두 끝낸 날"
                value={`${kpi.perfect.current}일`}
                note={`연속 · 최고 ${kpi.perfect.best}일`}
              />
              <StatTile
                label="이번 주 달성률"
                value={pct(kpi.week.rate)}
                note={
                  weekDelta === null ? (
                    '지난주 기록 없음'
                  ) : (
                    <>
                      <span style={{ color: weekDelta >= 0 ? 'var(--ok)' : 'var(--err)' }}>
                        {weekDelta > 0 ? '▲' : weekDelta < 0 ? '▼' : '＝'} {Math.abs(weekDelta)}%p
                      </span>{' '}
                      지난주 같은 기간 대비
                    </>
                  )
                }
              />
              <StatTile
                label="이번 주 기록 시간"
                value={fmtSecs(kpi.week.secs + liveSecs)}
                note={`하루 평균 ${fmtSecs((kpi.week.secs + liveSecs) / kpi.days)}`}
              />
            </div>

            <div style={{ ...twoCol(wide), marginTop: 'var(--gap-lg)' }}>
              <div ref={dayRef} style={{ scrollMarginTop: 16 }}>
                <DayList
                  routines={routines}
                  idx={idx}
                  date={selected}
                  today={today}
                  minDate={minDate}
                  timer={timer}
                  elapsed={elapsed}
                  busyId={busyId}
                  onDate={setSelected}
                  onToggle={onToggle}
                  onTimer={onTimer}
                  onStopTimer={onStopTimer}
                  onMinutes={onMinutes}
                  onAdd={(template) => setDialog({ mode: 'new', template })}
                  onManage={() => setDialog({ mode: 'list' })}
                  onEdit={(r) => setDialog({ mode: 'edit', id: r.id })}
                />
              </div>
              <InsightCard insights={insights} />
            </div>

            <SectionHead
              title="기록"
              right={<FilterRow routines={routines} focusId={focusId} onFocus={setFocusId} />}
            />

            <Heatmap
              routines={routines}
              single={focus}
              idx={idx}
              today={today}
              weekStart={weekStart}
              selected={selected}
              minDate={minDate}
              onSelect={selectDate}
            />

            <div style={{ ...twoCol(wide), marginTop: 'var(--gap-lg)' }}>
              <PeriodPanel
                routines={analysisSet}
                idx={idx}
                today={today}
                weekStart={weekStart}
                selected={selected}
                minDate={minDate}
                onSelect={selectDate}
              />
              <Breakdown
                routines={analysisSet}
                allRoutines={active}
                idx={idx}
                today={today}
                weekStart={weekStart}
                focus={focus}
              />
            </div>

            {rows.length > 0 && (
              <div style={{ marginTop: 'var(--gap-lg)' }}>
                <RoutineTable rows={rows} focusId={focusId} onFocus={setFocusId} />
              </div>
            )}
          </>
        )}
      </div>

      <RoutineDialog
        init={dialog}
        routines={routines}
        today={today}
        onClose={() => setDialog(null)}
        onChanged={async () => {
          await data.reload();
          notifyRoutinesChanged();
        }}
      />
      <RoutineSyncDialog
        open={syncOpen}
        status={syncStatus}
        onStatus={setSyncStatus}
        onClose={() => setSyncOpen(false)}
      />
    </div>
  );
}

function StatTile({
  label,
  value,
  note,
  meter,
}: {
  label: string;
  value: string;
  note: ReactNode;
  meter?: number | null;
}) {
  return (
    <Card padded={false}>
      <div
        style={{
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          minHeight: 92,
        }}
      >
        <span style={{ fontSize: 11.5, color: 'var(--ink-mute)' }}>{label}</span>
        <span
          style={{
            fontSize: 24,
            fontWeight: 600,
            color: 'var(--ink)',
            letterSpacing: '-0.4px',
            lineHeight: 1.15,
          }}
        >
          {value}
        </span>
        <span
          style={{
            fontSize: 11,
            color: 'var(--ink-mute)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {note}
        </span>
        {meter !== undefined && meter !== null && (
          <div style={{ marginTop: 4 }}>
            <MeterOk ratio={meter} />
          </div>
        )}
      </div>
    </Card>
  );
}

/** 달성 미터: 채움과 같은 계열의 옅은 트랙 */
function MeterOk({ ratio }: { ratio: number }) {
  const r = Math.max(0, Math.min(1, ratio));
  return (
    <span
      style={{
        display: 'block',
        height: 4,
        borderRadius: 999,
        background: 'var(--ok-soft)',
        overflow: 'hidden',
      }}
    >
      <span
        style={{
          display: 'block',
          height: '100%',
          width: `${r * 100}%`,
          background: 'var(--ok)',
          borderRadius: 999,
        }}
      />
    </span>
  );
}

const TONE: Record<RoutineInsight['tone'], { mark: string; color: string; label: string }> = {
  good: { mark: '▲', color: 'var(--ok)', label: '좋아요' },
  warn: { mark: '!', color: 'var(--warn)', label: '살펴볼 점' },
  info: { mark: '•', color: 'var(--blue)', label: '참고' },
};

function InsightCard({ insights }: { insights: RoutineInsight[] }) {
  return (
    <Card padded={false} style={{ height: '100%' }}>
      <div
        style={{
          padding: '12px 18px',
          borderBottom: '1px solid var(--line)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <CardTitle>분석</CardTitle>
        <Mono style={{ fontSize: 11, color: 'var(--ink-mute)' }}>기록에서 찾은 것</Mono>
      </div>
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: '8px 18px 14px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {insights.length === 0 ? (
          <li
            style={{ padding: '10px 0', fontSize: 12.5, color: 'var(--ink-mute)', lineHeight: 1.6 }}
          >
            기록이 1~2주 쌓이면 요일별 패턴, 스트릭 기록, 시간을 어디에 썼는지 정리해 드려요.
          </li>
        ) : (
          insights.map((i, n) => (
            <li
              key={i.id}
              style={{
                display: 'flex',
                gap: 10,
                padding: '10px 0',
                borderTop: n === 0 ? 'none' : '1px solid var(--line-subtle)',
              }}
            >
              <span
                aria-label={TONE[i.tone].label}
                title={TONE[i.tone].label}
                style={{
                  flex: '0 0 18px',
                  height: 18,
                  borderRadius: 999,
                  background: 'var(--bg-shade)',
                  color: TONE[i.tone].color,
                  fontSize: 10,
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 1,
                }}
              >
                {TONE[i.tone].mark}
              </span>
              <span style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.6 }}>
                {i.text}
              </span>
            </li>
          ))
        )}
      </ul>
    </Card>
  );
}

function SectionHead({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        margin: 'calc(var(--gap-lg) * 2.5) 0 var(--gap-lg)',
        flexWrap: 'wrap',
      }}
    >
      <h2 style={{ margin: 0, fontSize: 15, fontWeight: 650, color: 'var(--ink)' }}>{title}</h2>
      {right}
    </div>
  );
}

/** 아래 분석 카드 전부에 적용되는 루틴 필터. 한 줄, 카드 밖 */
function FilterRow({
  routines,
  focusId,
  onFocus,
}: {
  routines: RoutineT[];
  focusId: string | null;
  onFocus: (id: string | null) => void;
}) {
  const sorted = [...routines].sort((a, b) => Number(!!a.archivedAt) - Number(!!b.archivedAt));
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
      <button
        onClick={() => onFocus(null)}
        aria-pressed={focusId === null}
        style={filterChip(focusId === null)}
      >
        전체
      </button>
      {sorted.map((r) => (
        <button
          key={r.id}
          onClick={() => onFocus(focusId === r.id ? null : r.id)}
          aria-pressed={focusId === r.id}
          style={{ ...filterChip(focusId === r.id), opacity: r.archivedAt ? 0.6 : 1 }}
          title={r.archivedAt ? '보관한 루틴' : undefined}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: 999,
              background: routineColor(r.color),
              display: 'inline-block',
            }}
          />
          {r.title}
        </button>
      ))}
    </div>
  );
}

function filterChip(on: boolean): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 10px',
    fontSize: 11.5,
    border: `1px solid ${on ? 'var(--ink)' : 'var(--line)'}`,
    background: on ? 'var(--ink)' : 'transparent',
    color: on ? 'var(--on-accent)' : 'var(--ink-soft)',
    borderRadius: 999,
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  };
}

function grid(cols: number): CSSProperties {
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
    gap: 'var(--gap-lg)',
  };
}

function twoCol(wide: boolean): CSSProperties {
  return {
    display: 'grid',
    gridTemplateColumns: wide ? 'minmax(0, 1.4fr) minmax(0, 1fr)' : 'minmax(0, 1fr)',
    gap: 'var(--gap-lg)',
    alignItems: 'stretch',
  };
}

const primaryBtn: CSSProperties = {
  padding: '6px 12px',
  fontSize: 12,
  border: 'none',
  background: 'var(--ink)',
  color: 'var(--on-accent)',
  borderRadius: 6,
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontWeight: 500,
};

const ghostBtn: CSSProperties = {
  padding: '5px 12px',
  fontSize: 12,
  border: '1px solid var(--line)',
  background: 'var(--bg)',
  color: 'var(--ink)',
  borderRadius: 6,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const errorBox: CSSProperties = {
  padding: 14,
  marginBottom: 16,
  border: '1px solid var(--err-soft)',
  background: 'var(--err-soft)',
  color: 'var(--err)',
  borderRadius: 8,
  fontSize: 12,
};
