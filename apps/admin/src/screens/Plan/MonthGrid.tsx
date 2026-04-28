import type { Block } from '@vallista/content-core';
import { Mono } from '../../components/atoms/Atoms';

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

export function MonthGrid({
  anchor,
  now,
  blocks,
  onDayClick,
}: {
  anchor: Date;
  now: Date;
  blocks: Block[];
  onDayClick: (date: string) => void;
}) {
  const grid = buildGrid(anchor);
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
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
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
        {DAY_LABELS.map((l) => (
          <div
            key={l}
            style={{
              padding: '8px 10px',
              fontSize: 10.5,
              fontWeight: 600,
              color: 'var(--ink-soft)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              textAlign: 'right',
            }}
          >
            {l}
          </div>
        ))}
      </div>
      <div
        style={{
          flex: 1,
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
    </div>
  );
}

interface GridCell {
  dateKey: string;
  dayNumber: number;
  inMonth: boolean;
}

function buildGrid(anchor: Date): GridCell[] {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const last = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  const startOffset = (first.getDay() + 6) % 7;
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
