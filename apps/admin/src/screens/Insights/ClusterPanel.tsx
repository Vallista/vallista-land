import type { DocSummary } from '@vallista/content-core';
import { Card, CardTitle, Mono } from '../../components/atoms/Atoms';

interface ClusterStat {
  tag: string;
  docs: number;
  hot: boolean;
}

function aggregate(docs: DocSummary[]): ClusterStat[] {
  const map = new Map<string, number>();
  for (const d of docs) {
    for (const t of d.tags ?? []) {
      map.set(t, (map.get(t) ?? 0) + 1);
    }
  }
  const arr = Array.from(map.entries()).map(([tag, n], i) => ({
    tag,
    docs: n,
    hot: i === 0,
  }));
  return arr.sort((a, b) => b.docs - a.docs).slice(0, 6);
}

export function ClusterPanel({ docs }: { docs: DocSummary[] }) {
  const clusters = aggregate(docs);
  const max = clusters[0]?.docs ?? 1;

  return (
    <Card padded>
      <CardTitle style={{ marginBottom: 14 }}>주제 클러스터</CardTitle>
      {clusters.length === 0 ? (
        <div
          style={{
            padding: '24px 0',
            color: 'var(--ink-mute)',
            fontSize: 12.5,
            textAlign: 'center',
            fontStyle: 'italic',
          }}
        >
          태그가 없습니다
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {clusters.map((c) => (
            <div
              key={c.tag}
              style={{
                display: 'grid',
                gridTemplateColumns: '160px 1fr 60px',
                gap: 12,
                alignItems: 'center',
                fontSize: 13,
              }}
            >
              <span
                style={{
                  color: 'var(--ink)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={c.tag}
              >
                {c.hot && (
                  <span
                    style={{
                      color: 'var(--blue)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    ✦
                  </span>
                )}
                {c.tag}
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
                    width: `${(c.docs / max) * 100}%`,
                    background: c.hot ? 'var(--blue)' : 'var(--hl-violet)',
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
                {c.docs}곳
              </Mono>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
