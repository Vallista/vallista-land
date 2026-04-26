import type { Block } from '@vallista/content-core';
import { Card, CardTitle, Mono } from '../../components/atoms/Atoms';

const HOUR_START = 7;
const HOUR_END = 21;
const HOURS = HOUR_END - HOUR_START;
const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

function levelFromVal(v: number): number {
  if (v < 0.1) return 0;
  if (v < 0.3) return 1;
  if (v < 0.55) return 2;
  if (v < 0.8) return 3;
  return 4;
}

function heatColor(lvl: number): string {
  return [
    'var(--bg-soft)',
    'rgba(96,165,250,0.14)',
    'rgba(96,165,250,0.30)',
    'rgba(96,165,250,0.52)',
    'rgba(96,165,250,0.78)',
  ][lvl] ?? 'var(--bg-soft)';
}

interface HeatStats {
  grid: number[][];
  peak: { day: number; hour: number; val: number } | null;
  totalH: number;
  emptySlot: { day: number; hour: number } | null;
}

function buildHeat(blocks: Block[]): HeatStats {
  const grid: number[][] = Array.from({ length: 7 }, () => Array(HOURS).fill(0));
  for (const b of blocks) {
    const dow = mondayIdx(b.date);
    if (dow < 0 || dow >= 7) continue;
    const sH = parseTime(b.start);
    const eH = parseTime(b.end);
    if (sH === null || eH === null) continue;
    for (let h = HOUR_START; h < HOUR_END; h++) {
      const slotStart = h;
      const slotEnd = h + 1;
      const overlap = Math.max(0, Math.min(eH, slotEnd) - Math.max(sH, slotStart));
      if (overlap > 0) {
        const idx = h - HOUR_START;
        grid[dow]![idx] = (grid[dow]![idx] ?? 0) + overlap;
      }
    }
  }
  // normalize 0..1 by max cell
  let maxV = 0;
  for (const row of grid) {
    for (const v of row) {
      if (v > maxV) maxV = v;
    }
  }
  const norm: number[][] = grid.map((row) =>
    row.map((v) => (maxV > 0 ? v / maxV : 0)),
  );
  let peak: { day: number; hour: number; val: number } | null = null;
  let emptySlot: { day: number; hour: number } | null = null;
  let totalH = 0;
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < HOURS; h++) {
      const v = grid[d]![h] ?? 0;
      totalH += v;
      const norm_v = norm[d]![h] ?? 0;
      if (peak === null || norm_v > peak.val) {
        peak = { day: d, hour: h + HOUR_START, val: norm_v };
      }
      if (norm_v === 0 && emptySlot === null && d < 5 && h < 6) {
        emptySlot = { day: d, hour: h + HOUR_START };
      }
    }
  }
  return { grid: norm, peak, totalH, emptySlot };
}

export function HourHeatmap({ blocks }: { blocks: Block[] }) {
  const stats = buildHeat(blocks);

  return (
    <Card padded style={{ marginBottom: 20 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <CardTitle>시간대별 몰입 · 7일 × {HOURS}h</CardTitle>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 11,
            color: 'var(--ink-mute)',
          }}
        >
          <span>적음</span>
          {[1, 2, 3, 4].map((l) => (
            <span
              key={l}
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: heatColor(l),
                border: '1px solid var(--line)',
              }}
            />
          ))}
          <span>많음</span>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `32px repeat(${HOURS}, 1fr)`,
          gap: 3,
          fontSize: 10,
        }}
      >
        <div />
        {Array.from({ length: HOURS }, (_, h) => (
          <Mono
            key={h}
            style={{
              fontSize: 9.5,
              color: 'var(--ink-mute)',
              textAlign: 'center',
            }}
          >
            {pad(h + HOUR_START)}
          </Mono>
        ))}
        {stats.grid.map((row, d) => (
          <Row key={d} d={d} row={row} />
        ))}
      </div>

      <div
        style={{
          marginTop: 14,
          paddingTop: 12,
          borderTop: '1px solid var(--line)',
          display: 'flex',
          gap: 24,
          fontSize: 12,
          color: 'var(--ink-soft)',
          flexWrap: 'wrap',
        }}
      >
        {stats.peak && stats.peak.val > 0 && (
          <span>
            피크 시간대{' '}
            <Mono style={{ color: 'var(--blue)', marginLeft: 6 }}>
              {DAY_LABELS[stats.peak.day]} · {stats.peak.hour}–{stats.peak.hour + 1}시
            </Mono>
          </span>
        )}
        {stats.emptySlot && (
          <span>
            가장 비워진 슬롯{' '}
            <Mono style={{ color: 'var(--ink-mute)', marginLeft: 6 }}>
              {DAY_LABELS[stats.emptySlot.day]} · {stats.emptySlot.hour}시
            </Mono>
          </span>
        )}
        <span style={{ flex: 1 }} />
        <Mono style={{ color: 'var(--ink-mute)' }}>
          총 {stats.totalH.toFixed(1)}h
        </Mono>
      </div>
    </Card>
  );
}

function Row({ d, row }: { d: number; row: number[] }) {
  return (
    <>
      <Mono
        style={{
          fontSize: 10,
          color: 'var(--ink-soft)',
          textAlign: 'right',
          padding: '6px 4px 0 0',
        }}
      >
        {DAY_LABELS[d]}
      </Mono>
      {row.map((v, h) => {
        const lvl = levelFromVal(v);
        return (
          <div
            key={h}
            style={{
              height: 28,
              borderRadius: 3,
              background: heatColor(lvl),
              border: '1px solid var(--line)',
            }}
            title={`${DAY_LABELS[d]} ${h + HOUR_START}시 · ${(v * 100).toFixed(0)}%`}
          />
        );
      })}
    </>
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

function mondayIdx(date: string): number {
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return -1;
  const js = d.getDay();
  return (js + 6) % 7;
}
