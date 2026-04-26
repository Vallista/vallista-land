import type { Block } from '@vallista/content-core';
import { Card, CardTitle, Mono } from '../../components/atoms/Atoms';

interface PersonStat {
  name: string;
  count: number;
  lastDate: string;
}

function aggregate(blocks: Block[]): PersonStat[] {
  const map = new Map<string, PersonStat>();
  for (const b of blocks) {
    for (const p of b.attendees ?? []) {
      const cur = map.get(p);
      if (cur) {
        cur.count += 1;
        if (b.date > cur.lastDate) cur.lastDate = b.date;
      } else {
        map.set(p, { name: p, count: 1, lastDate: b.date });
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

export function PeoplePanel({ blocks, today }: { blocks: Block[]; today: string }) {
  const stats = aggregate(blocks).slice(0, 6);
  const max = stats[0]?.count ?? 1;

  return (
    <Card padded>
      <CardTitle style={{ marginBottom: 14 }}>이번 기간 사람</CardTitle>
      {stats.length === 0 ? (
        <div
          style={{
            padding: '24px 0',
            color: 'var(--ink-mute)',
            fontSize: 12.5,
            textAlign: 'center',
            fontStyle: 'italic',
          }}
        >
          참석자가 기록된 블록이 없습니다
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {stats.map((p) => (
            <div
              key={p.name}
              style={{
                display: 'grid',
                gridTemplateColumns: '110px 1fr 90px',
                gap: 12,
                alignItems: 'center',
                fontSize: 13,
              }}
            >
              <span
                style={{
                  color: 'var(--blue)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={p.name}
              >
                {p.name}
              </span>
              <div
                style={{
                  position: 'relative',
                  height: 6,
                  background: 'var(--bg-shade)',
                  borderRadius: 999,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: '0 auto 0 0',
                    width: `${(p.count / max) * 100}%`,
                    background: 'var(--blue)',
                    borderRadius: 999,
                    opacity: 0.55,
                  }}
                />
              </div>
              <Mono
                style={{
                  fontSize: 11,
                  color: 'var(--ink-mute)',
                  textAlign: 'right',
                }}
              >
                {p.count}회 · {relDay(p.lastDate, today)}
              </Mono>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function relDay(date: string, today: string): string {
  if (date === today) return '오늘';
  const d = new Date(`${date}T00:00:00`);
  const t = new Date(`${today}T00:00:00`);
  const diff = Math.round((t.getTime() - d.getTime()) / 86_400_000);
  if (diff === 1) return '어제';
  if (diff < 0) return `+${-diff}일`;
  if (diff < 30) return `${diff}일 전`;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return date;
  return `${m[2]}/${m[3]}`;
}
