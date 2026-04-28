import { Mono } from '../../components/atoms/Atoms';
import { MetaPanel } from './MetaPanel';

export function RightPane({ collection }: { collection: 'articles' | 'notes' }) {
  return (
    <div
      style={{
        borderLeft: '1px solid var(--line)',
        background: 'var(--bg-soft)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
      }}
    >
      <div
        style={{
          padding: '10px 14px',
          borderBottom: '1px solid var(--line)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <Mono
          style={{
            fontSize: 10.5,
            letterSpacing: '0.06em',
            color: 'var(--ink-mute)',
            fontWeight: 600,
          }}
        >
          META
        </Mono>
        <Mono style={{ fontSize: 9.5, color: 'var(--ink-faint)' }}>
          {collection === 'articles' ? '긴 글' : '짧은 글'}
        </Mono>
      </div>
      <MetaPanel collection={collection} />
    </div>
  );
}
