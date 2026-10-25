import { useMemo } from 'react';
import type { Routine } from '@vallista/content-core';
import { Card, CardTitle, Mono } from '../../components/atoms/Atoms';
import {
  addDays,
  fmtSecs,
  logOf,
  pct,
  rangeKeys,
  weekdayLabelOf,
  weekdayRates,
  type DayKey,
  type LogIndex,
} from '../../lib/routineStats';
import type { WeekStartDay } from '../../lib/weekStart';
import { HoverTip, useHoverTip } from './HoverTip';
import { routineColor } from './meta';

const BAR_H = 96;

/** 요일별 달성률 (최근 8주, 어제까지). 한 계열이라 한 색, 가장 높은 날·낮은 날만 값 라벨 */
export function WeekdayCard({
  routines,
  idx,
  today,
  weekStart,
  title,
}: {
  routines: Routine[];
  idx: LogIndex;
  today: DayKey;
  weekStart: WeekStartDay;
  title?: string;
}) {
  const { tip, show, hide } = useHoverTip();
  const rows = useMemo(() => {
    const rates = weekdayRates(routines, idx, addDays(today, -56), addDays(today, -1));
    const start = weekStart === 'mon' ? 1 : 0;
    return Array.from({ length: 7 }, (_, i) => {
      const dow = (start + i) % 7;
      return { dow, ...rates[dow]! };
    });
  }, [routines, idx, today, weekStart]);
  const judged = rows.filter((r) => r.rate !== null);
  const hi =
    judged.length > 1 ? judged.reduce((a, b) => ((b.rate ?? 0) > (a.rate ?? 0) ? b : a)) : null;
  const lowest =
    judged.length > 1 ? judged.reduce((a, b) => ((b.rate ?? 0) < (a.rate ?? 0) ? b : a)) : null;
  const lo = lowest && hi && lowest.rate !== hi.rate ? lowest : null;

  return (
    <Card padded={false} style={{ flex: '0 0 auto' }}>
      <div style={head}>
        <CardTitle>{title ?? '요일별 달성률'}</CardTitle>
        <Mono style={{ fontSize: 11, color: 'var(--ink-mute)' }}>최근 8주</Mono>
      </div>
      <div style={{ padding: '18px 18px 14px' }}>
        {judged.length === 0 ? (
          <Mono style={{ fontSize: 11.5, color: 'var(--ink-mute)' }}>
            지난 기록이 쌓이면 요일마다 얼마나 지켰는지 보여드려요.
          </Mono>
        ) : (
          <>
            <div style={{ position: 'relative', height: BAR_H }}>
              {[0, BAR_H / 2, BAR_H].map((y, i) => (
                <div
                  key={y}
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: y,
                    borderTop: `1px solid ${i === 2 ? 'var(--line-strong)' : 'var(--line)'}`,
                  }}
                />
              ))}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                  gap: 2,
                }}
              >
                {rows.map((r) => {
                  const h = r.rate === null ? 0 : Math.max(2, Math.round(r.rate * BAR_H));
                  const labelled = r === hi || r === lo;
                  return (
                    <div
                      key={r.dow}
                      tabIndex={0}
                      onMouseEnter={(e) =>
                        show(e, {
                          value:
                            r.rate === null
                              ? '예정 없음'
                              : `${pct(r.rate)} · ${r.done}/${r.scheduled}`,
                          label: `${weekdayLabelOf(r.dow)}요일 · 최근 8주`,
                        })
                      }
                      onFocus={(e) =>
                        show(e, {
                          value:
                            r.rate === null
                              ? '예정 없음'
                              : `${pct(r.rate)} · ${r.done}/${r.scheduled}`,
                          label: `${weekdayLabelOf(r.dow)}요일 · 최근 8주`,
                        })
                      }
                      onMouseLeave={hide}
                      onBlur={hide}
                      style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'center',
                        outline: 'none',
                      }}
                    >
                      {labelled && r.rate !== null && (
                        <Mono
                          style={{
                            position: 'absolute',
                            bottom: h + 4,
                            fontSize: 10.5,
                            color: 'var(--ink-2)',
                          }}
                        >
                          {pct(r.rate)}
                        </Mono>
                      )}
                      <span
                        style={{
                          width: 'min(24px, 60%)',
                          height: h,
                          borderRadius: '4px 4px 0 0',
                          background: 'var(--ok)',
                          opacity: r === lo ? 0.55 : 1,
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                gap: 2,
                marginTop: 6,
              }}
            >
              {rows.map((r) => (
                <div
                  key={r.dow}
                  style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 1 }}
                >
                  <Mono style={{ fontSize: 10.5, color: 'var(--ink-soft)' }}>
                    {weekdayLabelOf(r.dow)}
                  </Mono>
                  <Mono style={{ fontSize: 9.5, color: 'var(--ink-mute)' }}>
                    {r.rate === null ? '–' : `${r.done}/${r.scheduled}`}
                  </Mono>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <HoverTip tip={tip} />
    </Card>
  );
}

/** 루틴별 기록 시간 (최근 30일). 이름이 있는 범주라 막대는 한 색, 고른 루틴만 강조 */
export function TimeCard({
  routines,
  idx,
  today,
  focusId,
}: {
  routines: Routine[];
  idx: LogIndex;
  today: DayKey;
  focusId: string | null;
}) {
  const rows = useMemo(() => {
    const keys = rangeKeys(addDays(today, -29), today);
    return routines
      .map((r) => {
        let secs = 0;
        let days = 0;
        for (const k of keys) {
          const s = logOf(idx, r.id, k)?.secs ?? 0;
          secs += s;
          if (s >= 60) days += 1;
        }
        return { r, secs, days };
      })
      .filter((x) => x.secs >= 60)
      .sort((a, b) => b.secs - a.secs);
  }, [routines, idx, today]);
  const max = rows[0]?.secs ?? 0;
  const total = rows.reduce((a, x) => a + x.secs, 0);

  return (
    <Card padded={false} style={{ flex: '1 1 auto' }}>
      <div style={head}>
        <CardTitle>루틴별 기록 시간</CardTitle>
        <Mono style={{ fontSize: 11, color: 'var(--ink-mute)' }}>
          최근 30일{total > 0 ? ` · 합계 ${fmtSecs(total)}` : ''}
        </Mono>
      </div>
      <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rows.length === 0 ? (
          <Mono style={{ fontSize: 11.5, color: 'var(--ink-mute)', lineHeight: 1.6 }}>
            루틴 옆 ▶로 타이머를 켜거나 시간을 직접 적으면 여기에 쌓여요.
          </Mono>
        ) : (
          rows.map(({ r, secs, days }) => {
            const dimmed = focusId !== null && focusId !== r.id;
            return (
              <div key={r.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 999,
                      background: routineColor(r.color),
                      flex: '0 0 7px',
                    }}
                  />
                  <span
                    style={{
                      fontSize: 12.5,
                      color: dimmed ? 'var(--ink-mute)' : 'var(--ink)',
                      flex: 1,
                      minWidth: 0,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {r.title}
                  </span>
                  <Mono
                    style={{ fontSize: 11, color: dimmed ? 'var(--ink-mute)' : 'var(--ink-2)' }}
                  >
                    {fmtSecs(secs)}
                  </Mono>
                  <Mono
                    style={{
                      fontSize: 10,
                      color: 'var(--ink-faint)',
                      minWidth: 34,
                      textAlign: 'right',
                    }}
                  >
                    {days}일
                  </Mono>
                </div>
                <span
                  style={{
                    display: 'block',
                    height: 8,
                    borderRadius: 4,
                    background: 'var(--bg-soft)',
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      height: '100%',
                      width: `${max > 0 ? Math.max(2, (secs / max) * 100) : 0}%`,
                      borderRadius: '0 4px 4px 0',
                      background: dimmed ? 'var(--line-strong)' : 'var(--blue)',
                      transition: 'background 140ms',
                    }}
                  />
                </span>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}

const head = {
  padding: '12px 18px',
  borderBottom: '1px solid var(--line)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
} as const;

/** 기간 패널 옆 세로 묶음: 요일 패턴 + 루틴별 시간 */
export function Breakdown({
  routines,
  allRoutines,
  idx,
  today,
  weekStart,
  focus,
}: {
  routines: Routine[];
  allRoutines: Routine[];
  idx: LogIndex;
  today: DayKey;
  weekStart: WeekStartDay;
  focus: Routine | null;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-lg)', minWidth: 0 }}>
      <WeekdayCard
        routines={routines}
        idx={idx}
        today={today}
        weekStart={weekStart}
        title={focus ? `${focus.title} · 요일별` : undefined}
      />
      <TimeCard routines={allRoutines} idx={idx} today={today} focusId={focus?.id ?? null} />
    </div>
  );
}
