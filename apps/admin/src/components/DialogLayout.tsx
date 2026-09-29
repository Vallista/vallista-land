import type { ReactNode } from 'react';
import { Eyebrow } from './atoms/Atoms';

interface Props {
  open: boolean;
  popup?: boolean;
  dragRegion?: boolean;
  eyebrow: ReactNode;
  title: ReactNode;
  headerRight?: ReactNode;
  leftPane: ReactNode;
  rightPane?: ReactNode;
  footerLeft?: ReactNode;
  footerRight: ReactNode;
  onClose: () => void;
}

export function DialogLayout({
  open,
  popup = false,
  dragRegion = false,
  eyebrow,
  title,
  headerRight,
  leftPane,
  rightPane,
  footerLeft,
  footerRight,
  onClose,
}: Props) {
  if (!open) return null;

  return (
    <div
      onClick={popup ? undefined : (e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed',
        inset: 0,
        background: popup ? 'transparent' : 'rgba(0,0,0,0.45)',
        zIndex: 1000,
        display: 'flex',
        alignItems: popup ? 'flex-start' : 'center',
        justifyContent: 'center',
        padding: popup ? 8 : 'calc(var(--gap-lg) * 2.5)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: popup ? '100%' : 'min(820px, 100%)',
          height: popup ? '100%' : undefined,
          maxHeight: popup ? undefined : 'calc(100vh - 64px)',
          background: 'var(--bg)',
          border: '1px solid var(--line)',
          borderRadius: 12,
          boxShadow: popup ? '0 8px 32px rgba(0,0,0,0.3)' : '0 20px 60px rgba(0,0,0,0.4)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <header
          data-tauri-drag-region={dragRegion ? '' : undefined}
          style={{
            padding: '14px 18px 12px',
            borderBottom: '1px solid var(--line)',
            background: 'var(--bg-soft)',
            display: 'flex',
            alignItems: 'flex-end',
            gap: 10,
            userSelect: dragRegion ? 'none' : undefined,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <Eyebrow>{eyebrow}</Eyebrow>
            <h2
              style={{
                margin: '4px 0 0',
                fontSize: 16,
                fontWeight: 600,
                color: 'var(--ink)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {title}
            </h2>
          </div>
          {headerRight}
        </header>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: rightPane != null ? 'minmax(0, 1fr) minmax(0, 1fr)' : 'minmax(0, 1fr)',
            gridTemplateRows: 'minmax(0, 1fr)',
            gap: 0,
            minHeight: 0,
            flex: 1,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: 'var(--card-pad)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--gap-lg)',
              overflowY: 'auto',
              minHeight: 0,
            }}
          >
            {leftPane}
          </div>
          {rightPane != null && (
            <div
              style={{
                minHeight: 0,
                overflowY: 'auto',
                padding: 18,
                borderLeft: '1px solid var(--line)',
                background: 'var(--bg-soft)',
              }}
            >
              {rightPane}
            </div>
          )}
        </div>

        <footer
          style={{
            padding: '12px 18px',
            borderTop: '1px solid var(--line)',
            display: 'flex',
            gap: 8,
            alignItems: 'center',
          }}
        >
          {footerLeft && (
            <div style={{ marginRight: 'auto' }}>{footerLeft}</div>
          )}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: footerLeft ? 0 : 'auto' }}>
            {footerRight}
          </div>
        </footer>
      </div>
    </div>
  );
}
