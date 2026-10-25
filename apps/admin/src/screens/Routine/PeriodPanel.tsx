import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import type { Routine } from '@vallista/content-core';
import { Card, Mono } from '../../components/atoms/Atoms';
import {
  addDays,
  daysBetween,
  dowOf,
  fmtSecs,
  fmtSecsCompact,
  monthEndKey,
  monthStartKey,
  pct,
  summarize,
  weekStartKey,
  type DayKey,
  type DayStat,
  type LogIndex,
  type RangeSummary,
  weekdayLabelOf,
} from '../../lib/routineStats';
import { weekdayLabels, type WeekStartDay } from '../../lib/weekStart';
import { HoverTip, dateLabel, useHoverTip } from './HoverTip';
import { levelColor, rateLevel } from './Heatmap';

type Mode = 'week' | 'month';

interface Props {
  routines: Routine[];
  idx: LogIndex;
  today: DayKey;
  weekStart: WeekStartDay;
  selected: DayKey;
  minDate: DayKey;
  onSelect: (k: DayKey) => void;
}

function shiftMonth(k: DayKey, n: number): DayKey {
  const [y, m] = k.split('-').map((s) => Number.parseInt(s, 10));
  const d = new Date(y ?? 1970, (m ?? 1) - 1 + n, 1, 12);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function rangeOf(mode: Mode, anchor: DayKey, weekStart: WeekStartDay): [DayKey, DayKey] {
  if (mode === 'week') {
    const from = weekStartKey(anchor, weekStart);
    return [from, addDays(from, 6)];
  }
  return [monthStartKey(anchor), monthEndKey(anchor)];
}

function md(k: DayKey): string {
  return `${Number.parseInt(k.slice(5, 7), 10)}월 ${Number.parseInt(k.slice(8, 10), 10)}일`;
}

function titleOf(mode: Mode, from: DayKey, to: DayKey): string {
  if (mode === 'month') return `${from.slice(0, 4)}년 ${Number.parseInt(from.slice(5, 7), 10)}월`;
  const sameMonth = from.slice(0, 7) === to.slice(0, 7);
  return `${md(from)} – ${sameMonth ? `${Number.parseInt(to.slice(8, 10), 10)}일` : md(to)}`;
}

export function PeriodPanel({
  routines,
  idx,
  today,
  weekStart,
  selected,
  minDate,
  onSelect,
}: Props) {
  const [mode, setMode] = useState<Mode>('week');
  const [anchor, setAnchor] = useState<DayKey>(today);
  const { tip, show, hide } = useHoverTip();

  const [from, to] = rangeOf(mode, anchor, weekStart);
  const nextFrom = mode === 'week' ? addDays(from, 7) : shiftMonth(from, 1);
  const prevFrom = mode === 'week' ? addDays(from, -7) : shiftMonth(from, -1);
  const canNext = nextFrom <= today;
  const canPrev = addDays(from, -1) >= minDate;

  const cur = useMemo(
    () => summarize(routines, idx, from, to, today),
    [routines, idx, from, to, today],
  );
  const prev = useMemo(() => {
    const elapsed = daysBetween(from, to < today ? to : today);
    const prevEnd = mode === 'week' ? addDays(prevFrom, 6) : monthEndKey(prevFrom);
    const span = addDays(prevFrom, elapsed);
    return summarize(routines, idx, prevFrom, span < prevEnd ? span : prevEnd, today);
  }, [routines, idx, from, to, today, mode, prevFrom]);

  const delta =
    cur.rate !== null && prev.rate !== null && prev.scheduled > 0
      ? Math.round((cur.rate - prev.rate) * 100)
      : null;
  const prevName = mode === 'week' ? '지난주' : '지난달';

  const go = (k: DayKey) => setAnchor(k);

  return (
    <Card padded={false}>
      <div
        style={{
          padding: '10px 18px',
          borderBottom: '1px solid var(--line)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <Segmented
          value={mode}
          options={[
            { value: 'week', label: '주간' },
            { value: 'month', label: '월간' },
          ]}
          onChange={(m) => {
            setMode(m);
            setAnchor(today);
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 6 }}>
          <ArrowBtn
            label="‹"
            title={`이전 ${mode === 'week' ? '주' : '달'}`}
            disabled={!canPrev}
            onClick={() => go(prevFrom)}
          />
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--ink)',
              minWidth: 120,
              textAlign: 'center',
            }}
          >
            {titleOf(mode, from, to)}
          </span>
          <ArrowBtn
            label="›"
            title={`다음 ${mode === 'week' ? '주' : '달'}`}
            disabled={!canNext}
            onClick={() => go(nextFrom)}
          />
        </div>
        {(to < today || from > today) && (
          <button onClick={() => go(today)} style={linkBtn}>
            {mode === 'week' ? '이번 주' : '이번 달'}
          </button>
        )}
      </div>

      <div style={{ padding: '14px 18px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
          <Figure
            label="달성률"
            value={pct(cur.rate)}
            note={
              delta === null ? (
                <span>{prevName} 기록 없음</span>
              ) : delta === 0 ? (
                <span>{prevName}와 같음</span>
              ) : (
                <span style={{ color: delta > 0 ? 'var(--ok)' : 'var(--err)' }}>
                  {delta > 0 ? '▲' : '▼'} {Math.abs(delta)}%p
                  <span style={{ color: 'var(--ink-mute)' }}> {prevName} 대비</span>
                </span>
              )
            }
          />
          <Figure
            label="완료"
            value={`${cur.done}/${cur.scheduled}`}
            note={<span>예정한 회차 중</span>}
          />
          <Figure
            label="모두 끝낸 날"
            value={`${cur.perfectDays}일`}
            note={<span>하나라도 한 날 {cur.activeDays}일</span>}
          />
          <Figure
            label="기록 시간"
            value={fmtSecs(cur.secs)}
            note={
              <span>
                {prev.secs > 0 ? `${prevName} ${fmtSecs(prev.secs)}` : '타이머·직접 입력 합계'}
              </span>
            }
          />
        </div>

        {mode === 'week' ? (
          <WeekCharts
            summary={cur}
            weekStart={weekStart}
            today={today}
            selected={selected}
            minDate={minDate}
            onSelect={onSelect}
            onTip={show}
            onHide={hide}
          />
        ) : (
          <MonthGrid
            summary={cur}
            weekStart={weekStart}
            today={today}
            selected={selected}
            minDate={minDate}
            onSelect={onSelect}
            onTip={show}
            onHide={hide}
          />
        )}
      </div>
      <HoverTip tip={tip} />
    </Card>
  );
}

type TipFn = ReturnType<typeof useHoverTip>['show'];

interface ViewProps {
  summary: RangeSummary;
  weekStart: WeekStartDay;
  today: DayKey;
  selected: DayKey;
  minDate: DayKey;
  onSelect: (k: DayKey) => void;
  onTip: TipFn;
  onHide: () => void;
}

const BAR_MAX = 24;

function tipOf(s: DayStat) {
  return {
    value: s.scheduled > 0 ? `${s.done}/${s.scheduled} 완료 · ${pct(s.rate)}` : '예정 없음',
    label: dateLabel(s.date),
    extra:
      s.secs >= 60
        ? `기록 ${fmtSecs(s.secs)}`
        : s.extra > 0
          ? `예정 없던 루틴 ${s.extra}개 완료`
          : undefined,
  };
}

function WeekCharts({ summary, today, selected, minDate, onSelect, onTip, onHide }: ViewProps) {
  const days = summary.days;
  const maxSecs = Math.max(30 * 60, ...days.map((d) => d.secs));
  const col = (d: DayStat, chart: 'rate' | 'time', height: number) => {
    const ratio = chart === 'rate' ? (d.rate ?? 0) : d.secs / maxSecs;
    const h = d.future ? 0 : Math.round(ratio * height);
    const clickable = !d.future && d.date >= minDate;
    return (
      <button
        key={`${chart}-${d.date}`}
        onClick={() => clickable && onSelect(d.date)}
        onMouseEnter={(e) => !d.future && onTip(e, tipOf(d))}
        onFocus={(e) => !d.future && onTip(e, tipOf(d))}
        onMouseLeave={onHide}
        onBlur={onHide}
        disabled={!clickable}
        aria-label={`${dateLabel(d.date)} ${tipOf(d).value}`}
        style={{
          height,
          border: 'none',
          padding: 0,
          background: d.date === selected ? 'var(--bg-shade)' : 'transparent',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          cursor: clickable ? 'pointer' : 'default',
        }}
      >
        <span
          style={{
            width: `min(${BAR_MAX}px, 60%)`,
            height: Math.max(h, d.future || ratio === 0 ? 0 : 2),
            background: chart === 'rate' ? 'var(--ok)' : 'var(--blue)',
            borderRadius: '4px 4px 0 0',
            opacity: d.date === today && chart === 'rate' && (d.rate ?? 0) < 1 ? 0.7 : 1,
            transition: 'height 160ms',
          }}
        />
      </button>
    );
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      <ChartFrame title="날짜별 달성률" top="100%" mid="50%">
        <div style={gridCols}>{days.map((d) => col(d, 'rate', 110))}</div>
        <div style={gridCols}>
          {days.map((d) => (
            <AxisCell
              key={d.date}
              top={`${weekdayLabelOf(dowOf(d.date))} ${Number.parseInt(d.date.slice(8), 10)}`}
              bottom={d.future ? '' : d.scheduled > 0 ? `${d.done}/${d.scheduled}` : '–'}
              strong={d.date === today}
            />
          ))}
        </div>
      </ChartFrame>
      <ChartFrame
        title="날짜별 기록 시간"
        top={fmtSecsCompact(maxSecs)}
        mid={fmtSecsCompact(maxSecs / 2)}
      >
        <div style={gridCols}>{days.map((d) => col(d, 'time', 110))}</div>
        <div style={gridCols}>
          {days.map((d) => (
            <AxisCell
              key={d.date}
              top={`${weekdayLabelOf(dowOf(d.date))} ${Number.parseInt(d.date.slice(8), 10)}`}
              bottom={d.future ? '' : d.secs >= 60 ? fmtSecsCompact(d.secs) : '–'}
              strong={d.date === today}
            />
          ))}
        </div>
      </ChartFrame>
    </div>
  );
}

function ChartFrame({
  title,
  top,
  mid,
  children,
}: {
  title: string;
  top: string;
  mid: string;
  children: ReactNode;
}) {
  return (
    <div>
      <Mono style={{ fontSize: 10.5, color: 'var(--ink-soft)', letterSpacing: '0.04em' }}>
        {title}
      </Mono>
      <div style={{ position: 'relative', marginTop: 8 }}>
        {/* 가는 실선 격자: 위(최대)·가운데·바닥 */}
        {[0, 55, 110].map((y, i) => (
          <div
            key={y}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: y,
              borderTop: `1px solid ${i === 2 ? 'var(--line-strong)' : 'var(--line)'}`,
              pointerEvents: 'none',
            }}
          >
            {i < 2 && (
              <Mono
                style={{
                  position: 'absolute',
                  right: 0,
                  top: -13,
                  fontSize: 9.5,
                  color: 'var(--ink-faint)',
                }}
              >
                {i === 0 ? top : mid}
              </Mono>
            )}
          </div>
        ))}
        {children}
      </div>
    </div>
  );
}

function AxisCell({ top, bottom, strong }: { top: string; bottom: string; strong?: boolean }) {
  return (
    <div
      style={{
        textAlign: 'center',
        paddingTop: 6,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      <Mono
        style={{
          fontSize: 10,
          color: strong ? 'var(--ink)' : 'var(--ink-mute)',
          fontWeight: strong ? 600 : 400,
        }}
      >
        {top}
      </Mono>
      <Mono style={{ fontSize: 10, color: 'var(--ink-soft)' }}>{bottom}</Mono>
    </div>
  );
}

function MonthGrid({
  summary,
  weekStart,
  today,
  selected,
  minDate,
  onSelect,
  onTip,
  onHide,
}: ViewProps) {
  const first = summary.from;
  const lead = daysBetween(weekStartKey(first, weekStart), first);
  const cells: Array<DayStat | null> = [...Array<null>(lead).fill(null), ...summary.days];
  while (cells.length % 7 !== 0) cells.push(null);
  const labels = weekdayLabels(weekStart);
  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          gap: 4,
          marginBottom: 4,
        }}
      >
        {labels.map((l) => (
          <Mono key={l} style={{ fontSize: 10, color: 'var(--ink-mute)', textAlign: 'center' }}>
            {l}
          </Mono>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 4 }}>
        {cells.map((d, i) => {
          if (!d) return <div key={`pad-${i}`} />;
          const level = d.future ? 'none' : rateLevel(d.rate, d.extra);
          const clickable = !d.future && d.date >= minDate;
          const strongFill = level === 4 || level === 3;
          return (
            <button
              key={d.date}
              onClick={() => clickable && onSelect(d.date)}
              onMouseEnter={(e) => !d.future && onTip(e, tipOf(d))}
              onFocus={(e) => !d.future && onTip(e, tipOf(d))}
              onMouseLeave={onHide}
              onBlur={onHide}
              disabled={!clickable}
              aria-label={`${dateLabel(d.date)} ${tipOf(d).value}`}
              style={{
                height: 46,
                border: 'none',
                borderRadius: 6,
                padding: '5px 7px',
                background: d.future ? 'transparent' : levelColor(level),
                outline:
                  d.date === selected
                    ? '2px solid var(--ink)'
                    : d.date === today
                      ? '1px solid var(--ink-mute)'
                      : d.future
                        ? '1px solid var(--line-subtle)'
                        : 'none',
                outlineOffset: -1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                cursor: clickable ? 'pointer' : 'default',
                fontFamily: 'inherit',
              }}
            >
              <Mono
                style={{
                  fontSize: 11,
                  fontWeight: d.date === today ? 700 : 500,
                  color: strongFill
                    ? 'var(--on-accent)'
                    : d.future
                      ? 'var(--ink-faint)'
                      : 'var(--ink-2)',
                }}
              >
                {Number.parseInt(d.date.slice(8), 10)}
              </Mono>
              {!d.future && d.scheduled > 0 && (
                <Mono
                  style={{
                    fontSize: 9.5,
                    color: strongFill ? 'var(--on-accent)' : 'var(--ink-mute)',
                  }}
                >
                  {d.done}/{d.scheduled}
                </Mono>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Figure({ label, value, note }: { label: string; value: string; note: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
      <span style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{label}</span>
      <span style={{ fontSize: 20, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.2px' }}>
        {value}
      </span>
      <span
        style={{
          fontSize: 10.5,
          color: 'var(--ink-mute)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {note}
      </span>
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        padding: 2,
        background: 'var(--bg-soft)',
        border: '1px solid var(--line)',
        borderRadius: 6,
      }}
    >
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          aria-pressed={o.value === value}
          style={{
            padding: '3px 11px',
            border: 'none',
            background: o.value === value ? 'var(--bg-shade)' : 'transparent',
            color: o.value === value ? 'var(--ink)' : 'var(--ink-soft)',
            fontSize: 11.5,
            cursor: 'pointer',
            borderRadius: 4,
            fontFamily: 'inherit',
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ArrowBtn({
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
        width: 24,
        height: 24,
        border: 'none',
        borderRadius: 4,
        background: 'transparent',
        color: disabled ? 'var(--ink-faint)' : 'var(--ink-soft)',
        cursor: disabled ? 'default' : 'pointer',
        fontSize: 15,
        padding: 0,
        fontFamily: 'inherit',
      }}
    >
      {label}
    </button>
  );
}

const gridCols: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
  gap: 2,
};

const linkBtn: CSSProperties = {
  marginLeft: 'auto',
  border: 'none',
  background: 'transparent',
  color: 'var(--blue)',
  fontSize: 11.5,
  cursor: 'pointer',
  fontFamily: 'inherit',
  padding: 0,
};
