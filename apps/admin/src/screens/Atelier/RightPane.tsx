import { useState } from 'react';
import { Mono } from '../../components/atoms/Atoms';
import { MetaPanel } from './MetaPanel';
import { PreviewPanel } from './PreviewPanel';

type Tab = 'meta' | 'preview';

export function RightPane({ collection }: { collection: 'articles' | 'notes' }) {
  const [tab, setTab] = useState<Tab>('meta');
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
        <div style={{ display: 'flex', gap: 4 }}>
          <TabButton active={tab === 'meta'} onClick={() => setTab('meta')}>
            META
          </TabButton>
          <TabButton active={tab === 'preview'} onClick={() => setTab('preview')}>
            PREVIEW
          </TabButton>
        </div>
        <Mono style={{ fontSize: 9.5, color: 'var(--ink-faint)' }}>
          {collection === 'articles' ? '긴 글' : '짧은 글'}
        </Mono>
      </div>
      {tab === 'meta' ? <MetaPanel collection={collection} /> : <PreviewPanel />}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 10px',
        borderRadius: 4,
        border: 'none',
        background: active ? 'var(--bg-shade)' : 'transparent',
        color: active ? 'var(--ink)' : 'var(--ink-mute)',
        fontFamily: 'var(--font-mono)',
        fontSize: 10.5,
        letterSpacing: '0.06em',
        cursor: 'pointer',
        fontWeight: active ? 600 : 500,
      }}
    >
      {children}
    </button>
  );
}
