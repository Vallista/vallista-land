import type { Block, KnownBlockKind } from '@vallista/content-core';

const KIND_COLOR: Record<KnownBlockKind, string> = {
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

const KIND_LABEL: Record<KnownBlockKind, string> = {
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

const VISIBLE_KINDS: KnownBlockKind[] = ['routine', 'health', 'deep', 'people', 'meal', 'leisure'];

function colorOf(kind: string): string {
  return KIND_COLOR[kind as KnownBlockKind] ?? 'var(--ink-mute)';
}

export function Timeline({ blocks, now }: { blocks: Block[]; now: Date }) {
  const startH = 7;
  const endH = 22;
  const span = endH - startH;
  const nowH = now.getHours() + now.getMinutes() / 60;
  const nowPct = clampPct(((nowH - startH) / span) * 100);
  const nowLabel = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

  return (
    <div style={{ padding: '0 22px' }}>
      <div style={{ position: 'relative', height: 24, marginBottom: 8 }}>
        {Array.from({ length: span + 1 }, (_, i) => {
          const h = startH + i;
          const pct = (i / span) * 100;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${pct}%`,
                top: 0,
                transform: 'translateX(-50%)',
                fontFamily: 'var(--font-mono)',
                fontSize: 9.5,
                color: 'var(--ink-mute)',
              }}
            >
              {pad(h)}
            </div>
          );
        })}
        {nowH >= startH && nowH <= endH && (
          <div
            style={{
              position: 'absolute',
              left: `${nowPct}%`,
              top: 16,
              bottom: -4,
              width: 1,
              background: 'var(--blue)',
            }}
          />
        )}
      </div>

      <div
        style={{
          position: 'relative',
          height: 56,
          borderTop: '1px solid var(--line)',
          borderBottom: '1px solid var(--line)',
          background: 'var(--bg-soft)',
        }}
      >
        {Array.from({ length: span - 1 }, (_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${((i + 1) / span) * 100}%`,
              top: 0,
              bottom: 0,
              width: 1,
              background: 'var(--line-subtle)',
            }}
          />
        ))}

        {nowH >= startH && nowH <= endH && (
          <>
            <div
              style={{
                position: 'absolute',
                left: `${nowPct}%`,
                top: -4,
                bottom: -4,
                width: 1.5,
                background: 'var(--blue)',
                boxShadow: '0 0 6px rgba(96,165,250,0.5)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: `${nowPct}%`,
                top: -8,
                transform: 'translateX(-50%)',
                fontFamily: 'var(--font-mono)',
                fontSize: 9.5,
                color: 'var(--blue)',
                background: 'var(--bg)',
                padding: '1px 5px',
                borderRadius: 3,
                border: '1px solid var(--blue)',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
              }}
            >
              지금 {nowLabel}
            </div>
          </>
        )}

        {blocks.map((b) => {
          const startFrac = parseTime(b.start);
          const endFrac = parseTime(b.end);
          if (startFrac === null || endFrac === null) return null;
          const sH = Math.max(startH, Math.min(endH, startFrac));
          const eH = Math.max(startH, Math.min(endH, endFrac));
          if (eH <= sH) return null;
          const left = ((sH - startH) / span) * 100;
          const width = ((eH - sH) / span) * 100;
          const past = endFrac <= nowH || b.done;
          const color = colorOf(b.kind);
          return (
            <div
              key={b.id}
              title={`${b.start}–${b.end} · ${b.title}`}
              style={{
                position: 'absolute',
                top: 8,
                bottom: 8,
                left: `${left}%`,
                width: `${Math.max(width, 1.5)}%`,
                borderRadius: 4,
                background: past ? 'var(--bg-shade)' : color,
                opacity: past ? 0.55 : 0.85,
                border: `1px solid ${past ? 'var(--line)' : 'rgba(255,255,255,0.15)'}`,
                padding: '2px 6px',
                fontSize: 10.5,
                color: past ? 'var(--ink-mute)' : '#0b0b0c',
                fontWeight: 500,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {b.title}
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: 'flex',
          gap: 14,
          marginTop: 14,
          fontSize: 10.5,
          color: 'var(--ink-mute)',
          flexWrap: 'wrap',
        }}
      >
        {VISIBLE_KINDS.map((k) => (
          <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                background: KIND_COLOR[k],
                opacity: 0.85,
              }}
            />
            {KIND_LABEL[k]}
          </span>
        ))}
      </div>
    </div>
  );
}

function parseTime(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  if (!Number.isFinite(h) || !Number.isFinite(mi)) return null;
  return h + mi / 60;
}

function clampPct(n: number): number {
  if (n < 0) return 0;
  if (n > 100) return 100;
  return n;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
