import { useMemo, useState } from 'react';
import type { Block } from '@vallista/content-core';
import { Card, CardTitle, Mono } from '../../components/atoms/Atoms';
import { resolveLabel } from '../Plan/labelCatalog';

const DEEP_KINDS = new Set(['deep', 'write', 'build']);

function kindColor(kind: string): string {
  return resolveLabel(kind).color;
}

function kindLabel(kind: string): string {
  return resolveLabel(kind).name;
}

function durationH(start: string, end: string): number {
  const a = parseHHMM(start);
  const b = parseHHMM(end);
  if (a === null || b === null) return 0;
  return Math.max(0, b - a);
}

function parseHHMM(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  return Number(m[1]) + Number(m[2]) / 60;
}

const DOW = ['일', '월', '화', '수', '목', '금', '토'] as const;

function shortDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const dow = DOW[new Date(`${iso}T12:00:00`).getDay()];
  return `${m[2]}/${m[3]} (${dow})`;
}

function shortDateCol(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const dow = DOW[new Date(`${iso}T12:00:00`).getDay()];
  return `${Number(m[3])}일 ${dow}`;
}

const TH: React.CSSProperties = {
  padding: '0 10px 8px',
  textAlign: 'right',
  fontFamily: 'var(--font-mono)',
  fontSize: 10.5,
  fontWeight: 600,
  letterSpacing: '0.05em',
  color: 'var(--ink-mute)',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
};

const TD: React.CSSProperties = {
  padding: '8px 10px',
  textAlign: 'right',
  fontFamily: 'var(--font-mono)',
  fontSize: 12.5,
  color: 'var(--ink)',
};

interface DaySummary {
  date: string;
  totalH: number;
  deepH: number;
  meetH: number;
  blockCount: number;
  topAttendees: string[];
  blocks: Block[];
}

// ─── 날짜별 상세 테이블 ───────────────────────────────────────────────────────

export function WeeklyTable({ blocks }: { blocks: Block[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const days = useMemo<DaySummary[]>(() => {
    const map = new Map<string, Block[]>();
    for (const b of blocks) {
      const arr = map.get(b.date) ?? [];
      arr.push(b);
      map.set(b.date, arr);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, dayBlocks]) => {
        const totalH = dayBlocks.reduce((a, b) => a + durationH(b.start, b.end), 0);
        const deepH = dayBlocks
          .filter((b) => DEEP_KINDS.has(b.kind))
          .reduce((a, b) => a + durationH(b.start, b.end), 0);
        const meetH = dayBlocks
          .filter((b) => b.kind === 'meet')
          .reduce((a, b) => a + durationH(b.start, b.end), 0);

        const attendeeMap = new Map<string, number>();
        for (const b of dayBlocks) {
          for (const p of b.attendees ?? []) {
            attendeeMap.set(p, (attendeeMap.get(p) ?? 0) + 1);
          }
        }
        const topAttendees = Array.from(attendeeMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([name]) => name);

        return {
          date,
          totalH,
          deepH,
          meetH,
          blockCount: dayBlocks.length,
          topAttendees,
          blocks: [...dayBlocks].sort((a, b) => a.start.localeCompare(b.start)),
        };
      });
  }, [blocks]);

  if (days.length === 0) return null;

  const totals = {
    totalH: days.reduce((a, d) => a + d.totalH, 0),
    deepH: days.reduce((a, d) => a + d.deepH, 0),
    meetH: days.reduce((a, d) => a + d.meetH, 0),
    blockCount: days.reduce((a, d) => a + d.blockCount, 0),
  };

  return (
    <Card padded style={{ marginBottom: 'var(--gap-lg)' }}>
      <CardTitle style={{ marginBottom: 16 }}>날짜별 상세</CardTitle>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--line)' }}>
              <th style={{ ...TH, textAlign: 'left' }}>날짜</th>
              <th style={TH}>총 시간</th>
              <th style={TH}>딥워크</th>
              <th style={TH}>회의</th>
              <th style={TH}>블록</th>
              <th style={{ ...TH, textAlign: 'left' }}>주요 참석자</th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <>
                <tr
                  key={day.date}
                  onClick={() => setExpanded(expanded === day.date ? null : day.date)}
                  style={{
                    cursor: 'pointer',
                    borderBottom:
                      expanded === day.date ? 'none' : '1px solid var(--line-soft, var(--line))',
                    background: expanded === day.date ? 'var(--bg-soft)' : 'transparent',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => {
                    if (expanded !== day.date)
                      (e.currentTarget as HTMLElement).style.background = 'var(--bg-soft)';
                  }}
                  onMouseLeave={(e) => {
                    if (expanded !== day.date)
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }}
                >
                  <td style={{ ...TD, textAlign: 'left', color: 'var(--ink)', fontFamily: 'inherit' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span
                        style={{
                          fontSize: 9,
                          color: 'var(--ink-mute)',
                          transform: expanded === day.date ? 'rotate(90deg)' : 'none',
                          display: 'inline-block',
                          transition: 'transform 0.15s',
                        }}
                      >
                        ▶
                      </span>
                      {shortDate(day.date)}
                    </span>
                  </td>
                  <td style={TD}>{day.totalH > 0 ? `${day.totalH.toFixed(1)}h` : '—'}</td>
                  <td
                    style={{
                      ...TD,
                      color: day.deepH > 0 ? 'var(--blue)' : 'var(--ink-mute)',
                    }}
                  >
                    {day.deepH > 0 ? `${day.deepH.toFixed(1)}h` : '—'}
                  </td>
                  <td
                    style={{
                      ...TD,
                      color: day.meetH > 0 ? 'var(--hl-violet)' : 'var(--ink-mute)',
                    }}
                  >
                    {day.meetH > 0 ? `${day.meetH.toFixed(1)}h` : '—'}
                  </td>
                  <td style={{ ...TD, color: 'var(--ink-soft)' }}>{day.blockCount}</td>
                  <td
                    style={{
                      ...TD,
                      textAlign: 'left',
                      color: 'var(--ink-soft)',
                      fontSize: 11.5,
                      fontFamily: 'inherit',
                    }}
                  >
                    {day.topAttendees.length > 0 ? day.topAttendees.join(', ') : '—'}
                  </td>
                </tr>
                {expanded === day.date && (
                  <tr key={`${day.date}-expanded`}>
                    <td
                      colSpan={6}
                      style={{
                        padding: '6px 12px 14px',
                        borderBottom: '1px solid var(--line-soft, var(--line))',
                        background: 'var(--bg-soft)',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {day.blocks.map((b) => (
                          <div
                            key={b.id}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '96px 52px 1fr',
                              gap: 12,
                              padding: '4px 0',
                              fontSize: 12,
                              alignItems: 'baseline',
                            }}
                          >
                            <Mono style={{ color: 'var(--ink-mute)', fontSize: 11 }}>
                              {b.start}–{b.end}
                            </Mono>
                            <span
                              style={{
                                fontSize: 10.5,
                                fontWeight: 600,
                                letterSpacing: '0.04em',
                                color: kindColor(b.kind),
                                textTransform: 'uppercase',
                              }}
                            >
                              {kindLabel(b.kind)}
                            </span>
                            <span
                              style={{
                                color: 'var(--ink)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {b.title || b.customLabel || ''}
                              {(b.attendees?.length ?? 0) > 0 && (
                                <Mono style={{ color: 'var(--ink-mute)', fontSize: 10.5, marginLeft: 8 }}>
                                  {b.attendees.join(', ')}
                                </Mono>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
            <tr style={{ borderTop: '2px solid var(--line)' }}>
              <td
                style={{ ...TD, textAlign: 'left', color: 'var(--ink-mute)', fontFamily: 'inherit', fontWeight: 600 }}
              >
                합계
              </td>
              <td style={{ ...TD, fontWeight: 700 }}>{totals.totalH.toFixed(1)}h</td>
              <td style={{ ...TD, color: 'var(--blue)', fontWeight: 700 }}>{totals.deepH.toFixed(1)}h</td>
              <td style={{ ...TD, color: 'var(--hl-violet)', fontWeight: 700 }}>
                {totals.meetH.toFixed(1)}h
              </td>
              <td style={{ ...TD, color: 'var(--ink-soft)' }}>{totals.blockCount}</td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ─── 종류 × 날짜 그리드 ──────────────────────────────────────────────────────

export function KindGrid({ blocks }: { blocks: Block[] }) {
  const dates = useMemo(() => {
    const set = new Set<string>();
    for (const b of blocks) set.add(b.date);
    return Array.from(set).sort();
  }, [blocks]);

  // kind → (date → hours)
  const grid = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    for (const b of blocks) {
      const h = durationH(b.start, b.end);
      if (h <= 0) continue;
      const key = b.customLabel?.trim() || b.kind;
      if (!map.has(key)) map.set(key, new Map());
      const dm = map.get(key)!;
      dm.set(b.date, (dm.get(b.date) ?? 0) + h);
    }
    return map;
  }, [blocks]);

  const kinds = useMemo(
    () =>
      Array.from(grid.entries())
        .map(([k, v]) => ({ k, total: Array.from(v.values()).reduce((a, b) => a + b, 0) }))
        .sort((a, b) => b.total - a.total)
        .map(({ k }) => k),
    [grid],
  );

  if (kinds.length === 0 || dates.length === 0) return null;

  // max per cell for intensity
  const maxH = Math.max(
    ...Array.from(grid.values()).flatMap((m) => Array.from(m.values())),
    0,
  );

  return (
    <Card padded style={{ marginBottom: 'var(--gap-lg)' }}>
      <CardTitle style={{ marginBottom: 16 }}>종류별 × 날짜</CardTitle>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--line)' }}>
              <th style={{ ...TH, textAlign: 'left', minWidth: 72 }}>종류</th>
              {dates.map((d) => (
                <th key={d} style={TH}>
                  {shortDateCol(d)}
                </th>
              ))}
              <th style={TH}>합계</th>
            </tr>
          </thead>
          <tbody>
            {kinds.map((kind) => {
              const dm = grid.get(kind) ?? new Map<string, number>();
              const total = Array.from(dm.values()).reduce((a, b) => a + b, 0);
              const color = kindColor(kind);
              return (
                <tr key={kind} style={{ borderBottom: '1px solid var(--line-soft, var(--line))' }}>
                  <td style={{ ...TD, textAlign: 'left', fontFamily: 'inherit' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 2,
                          background: color,
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ color: 'var(--ink)', fontSize: 12.5 }}>{kindLabel(kind)}</span>
                    </span>
                  </td>
                  {dates.map((d) => {
                    const h = dm.get(d);
                    const intensity = h && maxH > 0 ? h / maxH : 0;
                    return (
                      <td
                        key={d}
                        title={h ? `${kindLabel(kind)} · ${shortDate(d)} · ${h.toFixed(1)}h` : undefined}
                        style={{
                          ...TD,
                          background: h
                            ? `color-mix(in srgb, ${color} ${Math.round(intensity * 55 + 10)}%, var(--bg))`
                            : 'transparent',
                          color: h ? color : 'var(--line)',
                          fontWeight: h ? 600 : 400,
                          borderRadius: 4,
                        }}
                      >
                        {h ? h.toFixed(1) : '·'}
                      </td>
                    );
                  })}
                  <td style={{ ...TD, fontWeight: 700, color: 'var(--ink)' }}>{total.toFixed(1)}h</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
