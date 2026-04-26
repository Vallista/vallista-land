import type { InsightsDocRef } from '../../lib/tauri';
import { Mono } from '../../components/atoms/Atoms';

type Props = {
  title: string;
  subtitle?: string;
  docs: InsightsDocRef[];
  emptyText: string;
};

export function DocSection({ title, subtitle, docs, emptyText }: Props) {
  return (
    <section>
      <header
        style={{
          marginBottom: 8,
          paddingBottom: 4,
          borderBottom: '1px solid var(--line)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <h2
            style={{
              margin: 0,
              fontSize: 11.5,
              fontWeight: 600,
              color: 'var(--ink-soft)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            {title}
          </h2>
          <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)' }}>{docs.length}</Mono>
        </div>
        {subtitle && (
          <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>{subtitle}</Mono>
        )}
      </header>

      {docs.length === 0 ? (
        <div
          style={{
            padding: '24px 0',
            color: 'var(--ink-mute)',
            fontSize: 13,
            fontStyle: 'italic',
            textAlign: 'center',
          }}
        >
          {emptyText}
        </div>
      ) : (
        <div>
          {docs.map((d) => (
            <Row key={d.id || d.path} doc={d} />
          ))}
        </div>
      )}
    </section>
  );
}

function Row({ doc }: { doc: InsightsDocRef }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '6px 4px',
        borderBottom: '1px solid var(--line)',
      }}
      title={doc.path}
    >
      <span
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: 13,
          color: 'var(--ink)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {doc.title || doc.path}
      </span>
      {doc.tags.length > 0 && (
        <Mono
          style={{
            fontSize: 10,
            color: 'var(--ink-mute)',
            whiteSpace: 'nowrap',
          }}
        >
          {doc.tags.slice(0, 2).map((t) => `#${t}`).join(' ')}
        </Mono>
      )}
    </div>
  );
}
