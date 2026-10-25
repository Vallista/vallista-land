import { useEffect, useMemo, useRef, useState } from 'react';
import type { Routine } from '@vallista/content-core';
import { Card, CardTitle, Mono } from '../../components/atoms/Atoms';
import {
  addDays,
  cellState,
  dayStat,
  daysBetween,
  fmtSecs,
  pct,
  summarize,
  weekStartKey,
  type CellState,
  type DayKey,
  type LogIndex,
} from '../../lib/routineStats';
import { weekdayLabels, type WeekStartDay } from '../../lib/weekStart';
import { HoverTip, dateLabel, useHoverTip } from './HoverTip';

const WEEKS = 53;
const GAP = 3;
const LABEL_W = 22;

type Level = 'none' | 0 | 1 | 2 | 3 | 4;

export function levelColor(l: Level): string {
  return l === 'none' ? 'var(--bg-soft)' : `var(--heat-${l})`;
}

export function rateLevel(rate: number | null, extra: number): Level {
  if (rate === null) return extra > 0 ? 1 : 'none';
  if (rate <= 0) return 0;
  if (rate < 0.34) return 1;
  if (rate < 0.67) return 2;
  if (rate < 1) return 3;
  return 4;
}

const SINGLE_LEVEL: Record<CellState, Level> = {
  done: 4,
  extra: 2,
  missed: 0,
  pending: 0,
  off: 'none',
};

const SINGLE_TEXT: Record<CellState, string> = {
  done: '완료',
  extra: '완료 (예정 없던 날)',
  missed: '놓침',
  pending: '아직 안 함',
  off: '쉬는 날',
};

interface Props {
  routines: Routine[];
  single: Routine | null;
  idx: LogIndex;
  today: DayKey;
  weekStart: WeekStartDay;
  selected: DayKey;
  minDate: DayKey;
  onSelect: (k: DayKey) => void;
}

export function Heatmap({
  routines,
  single,
  idx,
  today,
  weekStart,
  selected,
  minDate,
  onSelect,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);
  const { tip, show, hide } = useHoverTip();

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

  const start = weekStartKey(addDays(today, -7 * (WEEKS - 1)), weekStart);
  const cols = Math.ceil((daysBetween(start, today) + 1) / 7);
  const cell = Math.max(8, Math.min(16, Math.floor((width - LABEL_W) / cols) - GAP));
  const pitch = cell + GAP;

  const set = useMemo(() => (single ? [single] : routines), [single, routines]);
  const cells = useMemo(() => {
    const out: Array<{
      k: DayKey;
      col: number;
      row: number;
      level: Level;
      value: string;
      extra?: string;
    }> = [];
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < 7; r++) {
        const k = addDays(start, c * 7 + r);
        if (k > today) continue;
        const s = dayStat(set, idx, k, today);
        let level: Level;
        let value: string;
        if (single) {
          const st = cellState(single, idx, k, today);
          level = SINGLE_LEVEL[st];
          value = SINGLE_TEXT[st];
        } else {
          level = rateLevel(s.rate, s.extra);
          value =
            s.scheduled > 0
              ? `${s.done}/${s.scheduled} 완료 · ${pct(s.rate)}`
              : s.extra > 0
                ? `예정 없음 · ${s.extra}개 완료`
                : '예정 없음';
        }
        const extra = s.secs >= 60 ? `기록 ${fmtSecs(s.secs)}` : undefined;
        out.push({ k, col: c, row: r, level, value, extra });
      }
    }
    return out;
  }, [cols, start, today, set, idx, single]);

  const months = useMemo(() => {
    const out: Array<{ col: number; label: string }> = [];
    let prev = '';
    for (let c = 0; c < cols; c++) {
      const k = addDays(start, c * 7);
      const m = k.slice(0, 7);
      if (m !== prev) {
        if (c > 0 || addDays(k, 6).slice(0, 7) === m) {
          out.push({ col: c, label: `${Number.parseInt(k.slice(5, 7), 10)}월` });
        }
        prev = m;
      }
    }
    // 바짝 붙은 라벨은 앞엣것을 뺀다
    return out.filter((m, i) => !(out[i + 1] && out[i + 1]!.col - m.col < 3));
  }, [cols, start]);

  const summary = useMemo(() => summarize(set, idx, start, today, today), [set, idx, start, today]);
  const dows = weekdayLabels(weekStart);

  return (
    <Card padded={false}>
      <div
        style={{
          padding: '12px 18px',
          borderBottom: '1px solid var(--line)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <CardTitle>{single ? `${single.title} · ` : ''}최근 1년</CardTitle>
        <Mono style={{ fontSize: 11, color: 'var(--ink-mute)' }}>
          한 날 {summary.activeDays}일 · {single ? '완료' : '모두 끝낸 날'}{' '}
          {single ? summary.done : summary.perfectDays}일 · 달성률 {pct(summary.rate)}
        </Mono>
      </div>
      <div style={{ padding: '14px 18px 12px' }}>
        <div ref={wrapRef} style={{ width: '100%' }}>
          <div style={{ position: 'relative', height: 14, marginLeft: LABEL_W }}>
            {months.map((m) => (
              <Mono
                key={`${m.col}-${m.label}`}
                style={{
                  position: 'absolute',
                  left: m.col * pitch,
                  fontSize: 10,
                  color: 'var(--ink-mute)',
                }}
              >
                {m.label}
              </Mono>
            ))}
          </div>
          <div style={{ display: 'flex' }}>
            <div
              style={{
                width: LABEL_W,
                flex: `0 0 ${LABEL_W}px`,
                display: 'grid',
                gridTemplateRows: `repeat(7, ${cell}px)`,
                rowGap: GAP,
              }}
            >
              {dows.map((d, i) => (
                <Mono
                  key={d}
                  style={{
                    fontSize: 9.5,
                    color: 'var(--ink-mute)',
                    lineHeight: `${cell}px`,
                    visibility: i % 2 === 0 ? 'visible' : 'hidden',
                  }}
                >
                  {d}
                </Mono>
              ))}
            </div>
            <div
              role="grid"
              aria-label="일별 루틴 달성률"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${cols}, ${cell}px)`,
                gridTemplateRows: `repeat(7, ${cell}px)`,
                gridAutoFlow: 'column',
                gap: GAP,
              }}
            >
              {cells.map((c) => {
                const isSel = c.k === selected;
                const isToday = c.k === today;
                const clickable = c.k >= minDate;
                return (
                  <button
                    key={c.k}
                    tabIndex={-1}
                    onClick={() => clickable && onSelect(c.k)}
                    onMouseEnter={(e) =>
                      show(e, { value: c.value, label: dateLabel(c.k), extra: c.extra })
                    }
                    onMouseLeave={hide}
                    aria-label={`${dateLabel(c.k)} ${c.value}`}
                    style={{
                      gridColumn: c.col + 1,
                      gridRow: c.row + 1,
                      width: cell,
                      height: cell,
                      padding: 0,
                      border: 'none',
                      borderRadius: 3,
                      background: levelColor(c.level),
                      outline: isSel
                        ? '2px solid var(--ink)'
                        : isToday
                          ? '1px solid var(--ink-mute)'
                          : 'none',
                      outlineOffset: 1,
                      cursor: clickable ? 'pointer' : 'default',
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
        <div
          style={{
            marginTop: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <Mono style={{ fontSize: 10.5, color: 'var(--ink-faint)' }}>
            칸을 누르면 그 날 기록을 위에서 고칠 수 있어요
          </Mono>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 10.5,
              color: 'var(--ink-mute)',
            }}
          >
            <span style={{ marginRight: 2 }}>예정 없음</span>
            <Swatch level="none" />
            <span style={{ margin: '0 4px 0 10px' }}>0%</span>
            {([0, 1, 2, 3, 4] as Level[]).map((l) => (
              <Swatch key={String(l)} level={l} />
            ))}
            <span style={{ marginLeft: 4 }}>100%</span>
          </div>
        </div>
      </div>
      <HoverTip tip={tip} />
    </Card>
  );
}

function Swatch({ level }: { level: Level }) {
  return (
    <span
      style={{
        width: 10,
        height: 10,
        borderRadius: 2,
        background: levelColor(level),
        display: 'inline-block',
      }}
    />
  );
}
