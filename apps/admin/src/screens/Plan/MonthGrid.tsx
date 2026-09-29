import { useState } from 'react';
import type { Block } from '@vallista/content-core';
import { Mono } from '../../components/atoms/Atoms';
import { BlockInfoView } from './BlockInfoView';
import { weekdayIndex, weekdayLabels, type WeekStartDay } from '../../lib/weekStart';

export function MonthGrid({
  anchor,
  now,
  blocks,
  weekStartDay,
  onDayClick,
}: {
  anchor: Date;
  now: Date;
  blocks: Block[];
  weekStartDay: WeekStartDay;
  onDayClick: (date: string) => void;
}) {
  const [hover, setHover] = useState<{ block: Block; x: number; y: number } | null>(null);
  const grid = buildGrid(anchor, weekStartDay);
  const todayKey = isoKey(now);
  const byDate = new Map<string, Block[]>();
  for (const b of blocks) {
    const startDay = b.date;
    const endDay = b.endDate ?? b.date;
    let cursor = new Date(`${startDay}T00:00:00`);
    const last = new Date(`${endDay}T00:00:00`);
    while (cursor.getTime() <= last.getTime()) {
      const key = isoKey(cursor);
      const arr = byDate.get(key) ?? [];
      arr.push(b);
      byDate.set(key, arr);
      cursor = new Date(cursor.getTime() + 86400000);
    }
  }

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--bg)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          background: 'var(--bg-soft)',
          borderBottom: '1px solid var(--line)',
        }}
      >
        {weekdayLabels(weekStartDay).map((l) => (
          <div
            key={l}
            style={{
              padding: '8px 10px',
              fontSize: 10.5,
              fontWeight: 600,
              color: 'var(--ink-soft)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              textAlign: 'center',
            }}
          >
            {l}
          </div>
        ))}
      </div>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gridAutoRows: 'minmax(110px, 1fr)',
        }}
      >
        {grid.map((cell) => {
          const items = byDate.get(cell.dateKey) ?? [];
          const totalH = items.reduce(
            (a, b) => a + Math.max(0, durationHours(b.start, b.end)),
            0,
          );
          const dim = !cell.inMonth;
          const isToday = cell.dateKey === todayKey;
          return (
            <button
              key={cell.dateKey}
              onClick={() => onDayClick(cell.dateKey)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                padding: '6px 8px',
                border: 'none',
                borderRight: '1px solid var(--line-subtle)',
                borderBottom: '1px solid var(--line-subtle)',
                background: isToday ? 'var(--bg-shade)' : 'var(--bg)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'left',
                opacity: dim ? 0.4 : 1,
                minHeight: 110,
                overflow: 'hidden',
              }}
              title={`${cell.dateKey} · ${items.length}개 블록`}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: 6,
                }}
              >
                <Mono
                  style={{
                    fontSize: 12,
                    fontWeight: isToday ? 700 : 500,
                    color: isToday ? 'var(--blue)' : 'var(--ink)',
                  }}
                >
                  {cell.dayNumber}
                </Mono>
                {items.length > 0 && (
                  <Mono style={{ fontSize: 9.5, color: 'var(--ink-mute)' }}>
                    {items.length} · {totalH.toFixed(1)}h
                  </Mono>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {items.slice(0, 3).map((b) => (
                  <div
                    key={b.id}
                    onMouseEnter={(e) => { e.stopPropagation(); setHover({ block: b, x: e.clientX, y: e.clientY }); }}
                    onMouseMove={(e) => setHover({ block: b, x: e.clientX, y: e.clientY })}
                    onMouseLeave={() => setHover(null)}
                    style={{
                      fontSize: 10.5,
                      color: 'var(--ink-soft)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      textDecoration: b.done ? 'line-through' : 'none',
                      opacity: b.done ? 0.6 : 1,
                    }}
                  >
                    <span style={{ color: 'var(--ink-mute)' }}>{b.start}</span>{' '}
                    {b.title}
                  </div>
                ))}
                {items.length > 3 && (
                  <Mono style={{ fontSize: 9.5, color: 'var(--ink-mute)' }}>
                    +{items.length - 3}개
                  </Mono>
                )}
              </div>
            </button>
          );
        })}
      </div>
      {hover && <MonthHoverCard block={hover.block} x={hover.x} y={hover.y} />}
    </div>
  );
}

function MonthHoverCard({ block, x, y }: { block: Block; x: number; y: number }) {
  const W = 320;
  const H_EST = 260;
  const margin = 12;
  const winW = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const winH = typeof window !== 'undefined' ? window.innerHeight : 800;
  let left = x + 14;
  let top = y + 14;
  if (left + W + margin > winW) left = Math.max(margin, x - W - 14);
  if (top + H_EST + margin > winH) top = Math.max(margin, y - H_EST - 14);
  return (
    <div
      style={{
        position: 'fixed',
        left,
        top,
        zIndex: 9998,
        pointerEvents: 'none',
        width: W,
        maxHeight: H_EST,
        overflow: 'hidden',
        borderRadius: 6,
        boxShadow: '0 10px 30px rgba(0,0,0,0.22), 0 3px 8px rgba(0,0,0,0.14)',
      }}
    >
      <BlockInfoView block={block} dayDate={block.date} compact />
    </div>
  );
}

interface GridCell {
  dateKey: string;
  dayNumber: number;
  inMonth: boolean;
}

function buildGrid(anchor: Date, weekStartDay: WeekStartDay): GridCell[] {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const last = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  const startOffset = weekdayIndex(first, weekStartDay);
  const start = new Date(first);
  start.setDate(start.getDate() - startOffset);
  const cells: GridCell[] = [];
  const total = Math.ceil((startOffset + last.getDate()) / 7) * 7;
  for (let i = 0; i < total; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    cells.push({
      dateKey: isoKey(d),
      dayNumber: d.getDate(),
      inMonth: d.getMonth() === anchor.getMonth(),
    });
  }
  return cells;
}

function durationHours(startStr: string, endStr: string): number {
  const a = parseTime(startStr);
  const b = parseTime(endStr);
  if (a === null || b === null) return 0;
  return Math.max(0, b - a);
}

function parseTime(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  return Number(m[1]) + Number(m[2]) / 60;
}

function isoKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
