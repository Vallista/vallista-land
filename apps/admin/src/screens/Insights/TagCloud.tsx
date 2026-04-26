import type { InsightsTagCount } from '../../lib/tauri';
import { Mono } from '../../components/atoms/Atoms';

export function TagCloud({ tags }: { tags: InsightsTagCount[] }) {
  if (tags.length === 0) {
    return (
      <div
        style={{
          padding: '24px 0',
          color: 'var(--ink-mute)',
          fontSize: 13,
          fontStyle: 'italic',
          textAlign: 'center',
        }}
      >
        태그가 아직 없습니다
      </div>
    );
  }

  const max = tags[0]?.count ?? 1;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 4 }}>
      {tags.map((t) => {
        const weight = t.count / max;
        const fontSize = 10.5 + weight * 5;
        return (
          <span
            key={t.tag}
            style={{
              padding: '4px 9px',
              borderRadius: 999,
              background: 'var(--bg-shade)',
              border: '1px solid var(--line)',
              color: 'var(--ink)',
              fontFamily: 'var(--font-mono)',
              fontSize,
              display: 'inline-flex',
              alignItems: 'baseline',
              gap: 5,
              opacity: 0.6 + weight * 0.4,
            }}
          >
            #{t.tag}
            <Mono
              style={{
                fontSize: 9.5,
                color: 'var(--ink-mute)',
              }}
            >
              {t.count}
            </Mono>
          </span>
        );
      })}
    </div>
  );
}
