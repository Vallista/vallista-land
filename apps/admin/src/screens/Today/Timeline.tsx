import { useState } from 'react';
import type { Block, KnownBlockKind } from '@vallista/content-core';
import { resolveLabel } from '../Plan/labelCatalog';

const VISIBLE_KINDS: KnownBlockKind[] = ['routine', 'health', 'deep', 'people', 'meal', 'leisure'];

function colorOf(kind: string): string {
  return resolveLabel(kind).color;
}

interface NoteSnippet {
  title: string;
  body: string;
}

export function Timeline({
  blocks,
  now,
  notes = [],
}: {
  blocks: Block[];
  now: Date;
  notes?: NoteSnippet[];
}) {
  const startH = 7;
  const endH = 22;
  const span = endH - startH;
  const nowH = now.getHours() + now.getMinutes() / 60;
  const nowPct = clampPct(((nowH - startH) / span) * 100);
  const nowLabel = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const [tooltip, setTooltip] = useState<{ block: Block; rect: DOMRect } | null>(null);

  const findNote = (b: Block) =>
    notes.find((n) => n.title.trim() === b.title.trim());

  return (
    <div
      style={{ padding: '0 calc(var(--card-pad) + 2px)' }}
      onMouseLeave={() => setTooltip(null)}
    >
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
          const isHovered = tooltip?.block.id === b.id;
          return (
            <div
              key={b.id}
              onMouseEnter={(e) =>
                setTooltip({ block: b, rect: e.currentTarget.getBoundingClientRect() })
              }
              onMouseLeave={() => setTooltip(null)}
              style={{
                position: 'absolute',
                top: 8,
                bottom: 8,
                left: `${left}%`,
                width: `${Math.max(width, 1.5)}%`,
                borderRadius: 4,
                background: past ? 'var(--bg-shade)' : color,
                opacity: isHovered ? 1 : past ? 0.55 : 0.85,
                border: `1px solid ${isHovered ? 'rgba(255,255,255,0.4)' : past ? 'var(--line)' : 'rgba(255,255,255,0.15)'}`,
                padding: '2px 6px',
                fontSize: 10.5,
                color: past ? 'var(--ink-mute)' : '#0b0b0c',
                fontWeight: 500,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                display: 'flex',
                alignItems: 'center',
                cursor: 'default',
                transition: 'opacity 0.1s',
                zIndex: isHovered ? 2 : 1,
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
                background: resolveLabel(k).color,
                opacity: 0.85,
              }}
            />
            {resolveLabel(k).name}
          </span>
        ))}
      </div>

      {tooltip && (
        <BlockTooltip
          block={tooltip.block}
          rect={tooltip.rect}
          note={findNote(tooltip.block)}
        />
      )}
    </div>
  );
}

function BlockTooltip({
  block,
  rect,
  note,
}: {
  block: Block;
  rect: DOMRect;
  note: NoteSnippet | undefined;
}) {
  const cx = rect.left + rect.width / 2;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const tooltipW = 244;
  const left = Math.max(8, Math.min(cx - tooltipW / 2, vw - tooltipW - 8));
  const above = rect.top > 180;
  const kindLabel = resolveLabel(block.kind, block.color).name;
  const color = colorOf(block.kind);
  const hasExtra =
    block.attendees.length > 0 || !!block.notes || !!note || !!block.location;

  return (
    <div
      style={{
        position: 'fixed',
        left,
        top: above ? rect.top - 10 : rect.bottom + 10,
        transform: above ? 'translateY(-100%)' : 'none',
        zIndex: 500,
        width: tooltipW,
        background: 'var(--bg)',
        border: '1px solid var(--line-strong)',
        borderRadius: 8,
        boxShadow: '0 8px 28px rgba(0,0,0,0.2)',
        padding: '10px 12px',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--ink-mute)',
          marginBottom: 4,
          letterSpacing: '0.02em',
        }}
      >
        {block.start} – {block.end}
      </div>
      <div
        style={{
          fontSize: 13.5,
          fontWeight: 600,
          color: 'var(--ink)',
          lineHeight: 1.3,
          marginBottom: hasExtra ? 6 : 0,
        }}
      >
        {block.title}
      </div>
      {hasExtra && (
        <div
          style={{
            borderTop: '1px solid var(--line)',
            paddingTop: 6,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: 2,
                background: color,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 10.5, color: 'var(--ink-soft)' }}>{kindLabel}</span>
          </div>
          {block.location && (
            <div style={{ fontSize: 10.5, color: 'var(--ink-mute)' }}>
              📍 {block.location}
            </div>
          )}
          {block.attendees.length > 0 && (
            <div style={{ fontSize: 10.5, color: 'var(--ink-mute)' }}>
              👥{' '}
              {block.attendees.slice(0, 3).join(', ')}
              {block.attendees.length > 3 ? ` +${block.attendees.length - 3}` : ''}
            </div>
          )}
          {(block.notes || note) && (
            <div
              style={{
                fontSize: 11.5,
                color: 'var(--ink-soft)',
                lineHeight: 1.45,
                borderTop: '1px solid var(--line)',
                paddingTop: 5,
                marginTop: 2,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {(note?.body || block.notes || '').slice(0, 140)}
              {(note?.body || block.notes || '').length > 140 ? '…' : ''}
            </div>
          )}
        </div>
      )}
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
