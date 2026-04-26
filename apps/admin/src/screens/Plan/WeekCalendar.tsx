import type { Block, BlockKind } from '@vallista/content-core';
import { Mono } from '../../components/atoms/Atoms';

const HOUR_START = 7;
const HOUR_END = 20;
const HOURS = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => i + HOUR_START);
const HOUR_HEIGHT = 56;
const HEADER_HEIGHT = 38;

const KIND_COLOR: Record<
  BlockKind,
  { bg: string; border: string; ink: string }
> = {
  meet: {
    bg: 'rgba(196,181,253,0.10)',
    border: 'rgba(196,181,253,0.32)',
    ink: 'var(--hl-violet)',
  },
  write: {
    bg: 'rgba(96,165,250,0.10)',
    border: 'rgba(96,165,250,0.32)',
    ink: 'var(--blue)',
  },
  read: {
    bg: 'rgba(253,164,175,0.10)',
    border: 'rgba(253,164,175,0.32)',
    ink: 'var(--hl-rose)',
  },
  deep: {
    bg: 'rgba(74,222,128,0.10)',
    border: 'rgba(74,222,128,0.32)',
    ink: 'var(--ok)',
  },
  build: {
    bg: 'rgba(252,211,77,0.10)',
    border: 'rgba(252,211,77,0.32)',
    ink: 'var(--hl-amber)',
  },
  publish: {
    bg: 'rgba(96,165,250,0.18)',
    border: 'rgba(96,165,250,0.45)',
    ink: 'var(--blue)',
  },
  health: {
    bg: 'rgba(74,222,128,0.10)',
    border: 'rgba(74,222,128,0.32)',
    ink: 'var(--ok)',
  },
  meal: {
    bg: 'rgba(252,211,77,0.10)',
    border: 'rgba(252,211,77,0.32)',
    ink: 'var(--hl-amber)',
  },
  leisure: {
    bg: 'rgba(253,164,175,0.10)',
    border: 'rgba(253,164,175,0.32)',
    ink: 'var(--hl-rose)',
  },
  people: {
    bg: 'rgba(196,181,253,0.10)',
    border: 'rgba(196,181,253,0.32)',
    ink: 'var(--hl-violet)',
  },
  routine: {
    bg: 'rgba(120,120,128,0.10)',
    border: 'rgba(120,120,128,0.32)',
    ink: 'var(--ink-mute)',
  },
  life: {
    bg: 'rgba(120,120,128,0.10)',
    border: 'rgba(120,120,128,0.32)',
    ink: 'var(--ink-mute)',
  },
};

export interface CalendarDay {
  date: string;
  label: string;
  dayNumber: number;
  isToday: boolean;
}

export function WeekCalendar({
  days,
  blocks,
  now,
  onSlotClick,
  onBlockClick,
}: {
  days: CalendarDay[];
  blocks: Block[];
  now: Date;
  onSlotClick: (date: string, hour: number) => void;
  onBlockClick: (b: Block) => void;
}) {
  const nowH = now.getHours() + now.getMinutes() / 60;
  const todayKey = isoKey(now);
  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'auto' }}>
      <div
        style={{
          flex: '0 0 56px',
          borderRight: '1px solid var(--line)',
          background: 'var(--bg-soft)',
          display: 'flex',
          flexDirection: 'column',
          paddingTop: HEADER_HEIGHT + 4,
          position: 'sticky',
          left: 0,
          zIndex: 2,
        }}
      >
        {HOURS.map((h) => (
          <div
            key={h}
            style={{
              height: HOUR_HEIGHT,
              padding: '0 8px',
              textAlign: 'right',
            }}
          >
            <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)' }}>
              {pad(h)}:00
            </Mono>
          </div>
        ))}
      </div>
      <div style={{ flex: 1, display: 'flex', minWidth: 0 }}>
        {days.map((d) => {
          const dayBlocks = blocks.filter((b) => b.date === d.date);
          const showNow = d.date === todayKey;
          return (
            <DayColumn
              key={d.date}
              day={d}
              blocks={dayBlocks}
              showNow={showNow}
              nowH={nowH}
              onSlotClick={onSlotClick}
              onBlockClick={onBlockClick}
            />
          );
        })}
      </div>
    </div>
  );
}

function DayColumn({
  day,
  blocks,
  showNow,
  nowH,
  onSlotClick,
  onBlockClick,
}: {
  day: CalendarDay;
  blocks: Block[];
  showNow: boolean;
  nowH: number;
  onSlotClick: (date: string, hour: number) => void;
  onBlockClick: (b: Block) => void;
}) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        borderRight: '1px solid var(--line)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: '10px 12px',
          height: HEADER_HEIGHT,
          borderBottom: '1px solid var(--line)',
          background: 'var(--bg-soft)',
          display: 'flex',
          alignItems: 'baseline',
          gap: 8,
          position: 'sticky',
          top: 0,
          zIndex: 1,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--ink-soft)',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          {day.label}
        </span>
        <Mono
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: day.isToday ? 'var(--blue)' : 'var(--ink)',
          }}
        >
          {day.dayNumber}
        </Mono>
        {day.isToday && (
          <span
            style={{
              fontSize: 9,
              color: 'var(--blue)',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.06em',
              marginLeft: 'auto',
            }}
          >
            ● TODAY
          </span>
        )}
      </div>
      <div style={{ position: 'relative', flex: 1, minHeight: HOURS.length * HOUR_HEIGHT }}>
        {HOURS.map((h, i) => (
          <button
            key={h}
            type="button"
            onClick={() => onSlotClick(day.date, h)}
            style={{
              position: 'absolute',
              top: i * HOUR_HEIGHT,
              left: 0,
              right: 0,
              height: HOUR_HEIGHT,
              borderTop: i === 0 ? 'none' : '1px solid var(--line-subtle)',
              borderBottom: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              background: 'transparent',
              cursor: 'pointer',
              padding: 0,
            }}
            title={`${pad(h)}:00 슬롯에 추가`}
          />
        ))}
        {showNow && nowH >= HOUR_START && nowH <= HOUR_END + 1 && (
          <div
            style={{
              position: 'absolute',
              top: (nowH - HOUR_START) * HOUR_HEIGHT,
              left: 0,
              right: 0,
              height: 0,
              borderTop: '1.5px solid var(--blue)',
              zIndex: 5,
              pointerEvents: 'none',
            }}
          >
            <span
              style={{
                position: 'absolute',
                left: -5,
                top: -5,
                width: 8,
                height: 8,
                borderRadius: 999,
                background: 'var(--blue)',
              }}
            />
          </div>
        )}
        {blocks.map((b) => (
          <BlockBar key={b.id} block={b} onClick={() => onBlockClick(b)} />
        ))}
      </div>
    </div>
  );
}

function BlockBar({ block, onClick }: { block: Block; onClick: () => void }) {
  const startFrac = parseTime(block.start);
  const endFrac = parseTime(block.end);
  if (startFrac === null || endFrac === null) return null;
  const top = (startFrac - HOUR_START) * HOUR_HEIGHT;
  const h = Math.max(20, (endFrac - startFrac) * HOUR_HEIGHT - 4);
  const c = KIND_COLOR[block.kind] ?? KIND_COLOR.life;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{
        position: 'absolute',
        top,
        left: 4,
        right: 4,
        height: h,
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderLeft: `3px solid ${c.ink}`,
        borderRadius: 5,
        padding: '5px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        overflow: 'hidden',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'inherit',
        opacity: block.done ? 0.55 : 1,
      }}
      title={`${block.start}–${block.end} · ${block.title}`}
    >
      <div
        style={{
          fontSize: 11.5,
          fontWeight: 500,
          color: 'var(--ink)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          textDecoration: block.done ? 'line-through' : 'none',
        }}
      >
        {block.title}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Mono
          style={{
            fontSize: 9.5,
            color: c.ink,
            letterSpacing: '0.04em',
          }}
        >
          {block.start}
        </Mono>
        {block.attendees.length > 0 && (
          <span
            style={{
              fontSize: 9.5,
              color: 'var(--ink-mute)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {block.attendees.join(', ')}
          </span>
        )}
      </div>
    </button>
  );
}

function parseTime(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  return Number(m[1]) + Number(m[2]) / 60;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function isoKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
