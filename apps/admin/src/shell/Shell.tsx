import { useEffect, useState, type ReactNode } from 'react';
import { BrandMark, IconBtn, Kbd, Mono, StatusDot } from '../components/atoms/Atoms';
import { vaultInfo } from '../lib/tauri';
import type { VaultInfo } from '@vallista/content-core';

export type ScreenId = 'today' | 'plan' | 'glean' | 'atelier' | 'publish' | 'insights';

interface SidebarItem {
  id: ScreenId;
  label: string;
  icon: string;
  count?: number;
  badge?: string;
  emphasized?: boolean;
}

interface SidebarSection {
  label: string;
  items: SidebarItem[];
}

const SECTIONS: SidebarSection[] = [
  {
    label: '생활',
    items: [
      { id: 'today', label: '오늘', icon: '◐' },
      { id: 'plan', label: '할 일', icon: '▦' },
      { id: 'glean', label: '줍기', icon: '↧' },
    ],
  },
  {
    label: '블로그',
    items: [{ id: 'atelier', label: '글방', icon: '✎', emphasized: true }, { id: 'publish', label: '발행', icon: '↗' }],
  },
  {
    label: '돌아보기',
    items: [{ id: 'insights', label: '돌아보기', icon: '◇' }],
  },
];

interface SidebarProps {
  active: ScreenId;
  onSelect: (id: ScreenId) => void;
  vault: VaultInfo | null;
}

function Sidebar({ active, onSelect, vault }: SidebarProps) {
  return (
    <aside
      style={{
        flex: '0 0 var(--sidebar-w)',
        width: 'var(--sidebar-w)',
        borderRight: '1px solid var(--line)',
        padding: '14px 10px 18px',
        background: 'var(--bg-soft)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        overflowY: 'auto',
        height: '100%',
      }}
    >
      <div style={{ padding: '4px 10px 10px', display: 'flex', alignItems: 'center' }}>
        <BrandMark name="Pensmith" />
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {SECTIONS.map((sec, si) => (
          <SectionBlock key={sec.label} sec={sec} si={si} active={active} onSelect={onSelect} />
        ))}
      </nav>

      <div style={{ marginTop: 'auto', padding: '0 10px' }}>
        <div
          style={{
            padding: '10px 12px',
            background: 'var(--bg)',
            border: '1px solid var(--line)',
            borderRadius: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <StatusDot tone={vault ? 'ok' : 'mute'} pulse={!vault} />
            <Mono style={{ fontSize: 10.5, color: 'var(--ink-2)' }}>VAULT</Mono>
          </div>
          <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>
            {vault ? `${vault.articleCount} articles · ${vault.noteCount} notes` : 'connecting…'}
          </Mono>
        </div>
        <div style={{ marginTop: 10, fontSize: 10, color: 'var(--ink-mute)', fontFamily: 'var(--font-mono)' }}>
          Pensmith v0.0.1
        </div>
      </div>
    </aside>
  );
}

function SectionBlock({
  sec,
  si,
  active,
  onSelect,
}: {
  sec: SidebarSection;
  si: number;
  active: ScreenId;
  onSelect: (id: ScreenId) => void;
}) {
  return (
    <>
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--ink-mute)',
          padding: si === 0 ? '8px 10px 4px' : '18px 10px 4px',
        }}
      >
        {sec.label}
      </div>
      {sec.items.map((item) => (
        <SidebarRow key={item.id} item={item} active={active} onSelect={onSelect} />
      ))}
    </>
  );
}

function SidebarRow({
  item,
  active,
  onSelect,
}: {
  item: SidebarItem;
  active: ScreenId;
  onSelect: (id: ScreenId) => void;
}) {
  const isActive = item.id === active;
  return (
    <button
      onClick={() => onSelect(item.id)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '7px 10px',
        borderRadius: 6,
        border: 'none',
        background: isActive ? 'var(--bg-shade)' : 'transparent',
        color: isActive ? 'var(--ink)' : 'var(--ink-2)',
        fontSize: 13,
        fontWeight: isActive ? 500 : 400,
        fontFamily: 'inherit',
        cursor: 'pointer',
        transition: 'background 120ms, color 120ms',
        textAlign: 'left',
        width: '100%',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0, flex: 1 }}>
        <span
          style={{
            width: 14,
            flex: '0 0 14px',
            color: isActive ? 'var(--ink)' : 'var(--ink-mute)',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            lineHeight: 1,
            display: 'inline-flex',
            justifyContent: 'center',
          }}
        >
          {item.icon}
        </span>
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
        {item.emphasized && (
          <span
            style={{
              marginLeft: 4,
              fontSize: 9.5,
              color: 'var(--blue)',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.04em',
            }}
          >
            main
          </span>
        )}
      </span>
      {item.count !== undefined && (
        <Mono style={{ fontSize: 11, color: isActive ? 'var(--ink-2)' : 'var(--ink-mute)' }}>
          {item.count}
        </Mono>
      )}
    </button>
  );
}

function Topbar() {
  return (
    <header
      style={{
        height: 'var(--topbar-h)',
        flex: '0 0 var(--topbar-h)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 10px 0 0',
        background: 'var(--bg-soft)',
        borderBottom: '1px solid var(--line)',
        position: 'relative',
      }}
    >
      <div style={{ width: 78, flex: '0 0 78px' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconBtn title="사이드바">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" />
            <line x1="6" y1="2.5" x2="6" y2="13.5" stroke="currentColor" />
          </svg>
        </IconBtn>
      </div>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '0 16px' }}>
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: '100%',
            maxWidth: '32vw',
            height: 28,
            padding: '0 10px',
            background: 'var(--bg)',
            border: '1px solid var(--line)',
            borderRadius: 6,
            color: 'var(--ink-mute)',
            fontFamily: 'inherit',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.3" />
            <path d="M9.2 9.2 12 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <span style={{ flex: 1, textAlign: 'left' }}>노트 · 할일 · 클립 · 글 검색</span>
          <Kbd>⌘K</Kbd>
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} />
    </header>
  );
}

export function Shell({
  active,
  onSelect,
  children,
}: {
  active: ScreenId;
  onSelect: (id: ScreenId) => void;
  children: ReactNode;
}) {
  const [vault, setVault] = useState<VaultInfo | null>(null);

  useEffect(() => {
    vaultInfo()
      .then(setVault)
      .catch(() => setVault(null));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)' }}>
      <Topbar />
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Sidebar active={active} onSelect={onSelect} vault={vault} />
        <main style={{ flex: 1, minWidth: 0, overflow: 'auto' }}>{children}</main>
      </div>
    </div>
  );
}
