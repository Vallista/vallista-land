import type { Mood } from '@vallista/content-core';
import { Card, CardTitle, Mono } from '../../components/atoms/Atoms';

export function MoodPanel({ moods }: { moods: Mood[] }) {
  if (moods.length === 0) {
    return (
      <Card padded>
        <CardTitle style={{ marginBottom: 12 }}>기분 · 에너지</CardTitle>
        <div
          style={{
            padding: '24px 0',
            color: 'var(--ink-mute)',
            fontSize: 12.5,
            textAlign: 'center',
            fontStyle: 'italic',
          }}
        >
          이 기간에 기록된 컨디션이 없습니다
        </div>
      </Card>
    );
  }

  const sorted = [...moods]
    .filter((m): m is Mood & { energy: number; mood: number } =>
      typeof m.energy === 'number' && typeof m.mood === 'number',
    )
    .sort((a, b) => a.date.localeCompare(b.date));
  const tail = sorted.slice(-7);

  if (tail.length === 0) {
    return (
      <Card padded>
        <CardTitle style={{ marginBottom: 12 }}>기분 · 에너지</CardTitle>
        <div
          style={{
            padding: '24px 0',
            color: 'var(--ink-mute)',
            fontSize: 12.5,
            textAlign: 'center',
            fontStyle: 'italic',
          }}
        >
          이 기간에 기록된 컨디션이 없습니다
        </div>
      </Card>
    );
  }

  return (
    <Card padded>
      <CardTitle style={{ marginBottom: 16 }}>기분 · 에너지</CardTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {tail.map((m) => (
          <div
            key={m.date}
            style={{ display: 'flex', alignItems: 'center', gap: 12 }}
          >
            <Mono
              style={{ fontSize: 11.5, color: 'var(--ink-soft)', width: 44 }}
            >
              {shortDate(m.date)}
            </Mono>
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
              }}
              title={`${shortDate(m.date)} · 에너지 ${Math.round(m.energy * 100)} · 기분 ${Math.round(m.mood * 100)}${m.note ? ` · ${m.note}` : ''}`}
            >
              <Bar value={m.energy} color="var(--hl-amber)" label={`에너지 ${Math.round(m.energy * 100)}`} />
              <Bar value={m.mood} color="var(--blue)" label={`기분 ${Math.round(m.mood * 100)}`} />
            </div>
            <span
              style={{
                fontSize: 11,
                color: 'var(--ink-mute)',
                width: 130,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={m.note ?? ''}
            >
              {m.note ?? ''}
            </span>
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: 14,
          paddingTop: 12,
          borderTop: '1px solid var(--line)',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          fontSize: 11,
          color: 'var(--ink-mute)',
        }}
      >
        <Legend label="에너지" color="var(--hl-amber)" />
        <Legend label="기분" color="var(--blue)" />
      </div>
    </Card>
  );
}

function Bar({
  value,
  color,
  label,
}: {
  value: number;
  color: string;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div
      title={label}
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
          background: color,
          borderRadius: 999,
          opacity: 0.65,
        }}
      />
    </div>
  );
}

function Legend({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 2,
          background: color,
          opacity: 0.65,
        }}
      />
      {label}
    </span>
  );
}

function shortDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return `${m[2]}/${m[3]}`;
}
