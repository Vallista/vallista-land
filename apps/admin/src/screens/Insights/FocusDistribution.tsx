import type { Block, BlockKind } from '@vallista/content-core';
import { Card, CardTitle, Mono } from '../../components/atoms/Atoms';

const KIND_COLOR: Record<BlockKind, string> = {
  routine: 'var(--ink-mute)',
  health: 'var(--ok)',
  deep: 'var(--blue)',
  people: 'var(--hl-violet)',
  meal: 'var(--hl-amber)',
  leisure: 'var(--hl-rose)',
  meet: 'var(--hl-violet)',
  write: 'var(--blue)',
  read: 'var(--hl-rose)',
  build: 'var(--blue)',
  publish: 'var(--ok)',
  life: 'var(--ink-mute)',
};

const KIND_LABEL: Record<BlockKind, string> = {
  routine: '루틴',
  health: '건강',
  deep: '몰입',
  people: '사람',
  meal: '식사',
  leisure: '여가',
  meet: '미팅',
  write: '글쓰기',
  read: '독서',
  build: '제작',
  publish: '배포',
  life: '일상',
};

export interface FocusBucket {
  kind: BlockKind;
  hours: number;
  color: string;
  label: string;
}

export function bucketBlocks(blocks: Block[]): FocusBucket[] {
  const totals = new Map<BlockKind, number>();
  for (const b of blocks) {
    if (b.done === false) continue;
    const dur = durationHours(b.start, b.end);
    if (dur <= 0) continue;
    totals.set(b.kind, (totals.get(b.kind) ?? 0) + dur);
  }
  // include all blocks (planned/incomplete) under hours total too
  for (const b of blocks) {
    if (b.done) continue;
    const dur = durationHours(b.start, b.end);
    if (dur <= 0) continue;
    totals.set(b.kind, (totals.get(b.kind) ?? 0) + dur);
  }
  const out: FocusBucket[] = [];
  for (const [k, h] of totals.entries()) {
    out.push({ kind: k, hours: h, color: KIND_COLOR[k], label: KIND_LABEL[k] });
  }
  return out.sort((a, b) => b.hours - a.hours);
}

export function FocusDistribution({ blocks }: { blocks: Block[] }) {
  const buckets = bucketBlocks(blocks);
  const total = buckets.reduce((a, b) => a + b.hours, 0);

  if (buckets.length === 0) {
    return (
      <Card padded>
        <CardTitle style={{ marginBottom: 12 }}>몰입 분포 · 종류별</CardTitle>
        <Empty text="이 기간에 기록된 블록이 없습니다" />
      </Card>
    );
  }

  return (
    <Card padded>
      <CardTitle style={{ marginBottom: 16 }}>몰입 분포 · 종류별</CardTitle>
      <div
        style={{
          display: 'flex',
          height: 12,
          borderRadius: 6,
          overflow: 'hidden',
          border: '1px solid var(--line)',
          background: 'var(--bg-soft)',
          marginBottom: 18,
        }}
      >
        {buckets.map((f) => (
          <div
            key={f.kind}
            style={{ flex: f.hours, background: f.color }}
            title={`${f.label} · ${f.hours.toFixed(1)}h`}
          />
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {buckets.map((f) => {
          const pct = total > 0 ? (f.hours / total) * 100 : 0;
          return (
            <div
              key={f.kind}
              style={{
                display: 'grid',
                gridTemplateColumns: '80px 1fr 60px 60px',
                gap: 12,
                alignItems: 'center',
                fontSize: 12.5,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background: f.color,
                  }}
                />
                <span style={{ color: 'var(--ink)' }}>{f.label}</span>
              </div>
              <div
                style={{
                  position: 'relative',
                  height: 4,
                  background: 'var(--bg-shade)',
                  borderRadius: 999,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: '0 auto 0 0',
                    width: `${pct}%`,
                    background: f.color,
                    borderRadius: 999,
                    opacity: 0.6,
                  }}
                />
              </div>
              <Mono
                style={{
                  fontSize: 11.5,
                  color: 'var(--ink-soft)',
                  textAlign: 'right',
                }}
              >
                {f.hours.toFixed(1)}h
              </Mono>
              <Mono
                style={{ fontSize: 11, color: 'var(--ink-mute)', textAlign: 'right' }}
              >
                {pct.toFixed(0)}%
              </Mono>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div
      style={{
        padding: '24px 0',
        color: 'var(--ink-mute)',
        fontSize: 12.5,
        textAlign: 'center',
        fontStyle: 'italic',
      }}
    >
      {text}
    </div>
  );
}

function durationHours(start: string, end: string): number {
  const a = parseTime(start);
  const b = parseTime(end);
  if (a === null || b === null) return 0;
  return Math.max(0, b - a);
}

function parseTime(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  return Number(m[1]) + Number(m[2]) / 60;
}
