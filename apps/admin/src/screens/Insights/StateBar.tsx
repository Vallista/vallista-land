import type { InsightsStateCounts } from '../../lib/tauri';
import { Mono } from '../../components/atoms/Atoms';

const STATE_COLOR: Record<keyof InsightsStateCounts, string> = {
  seed: 'var(--ink-mute)',
  sprout: 'var(--blue)',
  draft: 'var(--warn)',
  published: 'var(--ok)',
};

const STATE_LABEL: Record<keyof InsightsStateCounts, string> = {
  seed: '씨앗',
  sprout: '새싹',
  draft: '초안',
  published: '공개',
};

const ORDER: (keyof InsightsStateCounts)[] = ['seed', 'sprout', 'draft', 'published'];

export function StateBar({ counts, total }: { counts: InsightsStateCounts; total: number }) {
  return (
    <div style={{ marginTop: 4 }}>
      <div
        style={{
          display: 'flex',
          height: 8,
          borderRadius: 4,
          overflow: 'hidden',
          background: 'var(--bg-shade)',
          border: '1px solid var(--line)',
        }}
      >
        {ORDER.map((k) => {
          const n = counts[k];
          if (total === 0 || n === 0) return null;
          return (
            <div
              key={k}
              style={{
                flex: n,
                background: STATE_COLOR[k],
                opacity: 0.8,
              }}
              title={`${STATE_LABEL[k]} ${n}`}
            />
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 18, marginTop: 8, flexWrap: 'wrap' }}>
        {ORDER.map((k) => (
          <Cell key={k} label={STATE_LABEL[k]} count={counts[k]} color={STATE_COLOR[k]} />
        ))}
        <Cell label="합계" count={total} color="var(--ink)" />
      </div>
    </div>
  );
}

function Cell({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 2,
          background: color,
          opacity: 0.85,
        }}
      />
      <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{label}</span>
      <Mono style={{ fontSize: 12, color: 'var(--ink)', fontWeight: 600 }}>{count}</Mono>
    </div>
  );
}
