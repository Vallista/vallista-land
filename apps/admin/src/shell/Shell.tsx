import { useEffect, useState, type ReactNode } from 'react';
import { BrandMark, IconBtn, Kbd, Mono, StatusDot } from '../components/atoms/Atoms';
import { listDocs, listGlean, listTasks, llmStatus, vaultInfo } from '../lib/tauri';
import type { LlmStatus } from '../lib/tauri';
import type { VaultInfo } from '@vallista/content-core';
import type { QuickKind } from '../components/QuickEntry';

export type ScreenId =
  | 'today'
  | 'thoughts'
  | 'plan'
  | 'glean'
  | 'atelier'
  | 'publish'
  | 'insights';

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

interface Counts {
  plan?: number;
  planBadge?: string;
  glean?: number;
  gleanBadge?: string;
  atelier?: number;
  thoughts?: number;
}

function buildSections(counts: Counts, blogEnabled: boolean): SidebarSection[] {
  const sections: SidebarSection[] = [
    {
      label: '생활',
      items: [
        { id: 'today', label: '오늘', icon: '⊙' },
        { id: 'thoughts', label: '생각', icon: '⌇', count: counts.thoughts },
        { id: 'plan', label: '할 일', icon: '☐', count: counts.plan, badge: counts.planBadge },
        { id: 'glean', label: '줍기', icon: '⊞', count: counts.glean, badge: counts.gleanBadge },
      ],
    },
  ];
  if (blogEnabled) {
    sections.push({
      label: '블로그',
      items: [
        { id: 'atelier', label: '글방', icon: '▤', count: counts.atelier, emphasized: true },
        { id: 'publish', label: '발행', icon: '↗' },
      ],
    });
  }
  sections.push({
    label: '돌아보기',
    items: [{ id: 'insights', label: '돌아보기', icon: '◈' }],
  });
  return sections;
}

interface SidebarProps {
  active: ScreenId;
  onSelect: (id: ScreenId) => void;
  vault: VaultInfo | null;
  llm: LlmStatus | null;
  counts: Counts;
  collapsed: boolean;
  blogEnabled: boolean;
  onOpenLLMSetup: () => void;
}

function Sidebar({ active, onSelect, vault, llm, counts, collapsed, blogEnabled, onOpenLLMSetup }: SidebarProps) {
  const sections = buildSections(counts, blogEnabled);
  if (collapsed) {
    return (
      <aside
        style={{
          flex: '0 0 56px',
          width: 56,
          borderRight: '1px solid var(--line)',
          padding: '14px 0 18px',
          background: 'var(--bg-soft)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          overflowY: 'auto',
          height: '100%',
        }}
      >
        {sections.flatMap((sec) =>
          sec.items.map((item) => (
            <CollapsedRow key={item.id} item={item} active={active} onSelect={onSelect} />
          )),
        )}
      </aside>
    );
  }
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
        <BrandMark name="Bento" />
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {sections.map((sec, si) => (
          <SectionBlock key={sec.label} sec={sec} si={si} active={active} onSelect={onSelect} />
        ))}
      </nav>

      <div style={{ marginTop: 'auto', padding: '0 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <LlmCard llm={llm} onClick={onOpenLLMSetup} />
        {blogEnabled && <VaultCard vault={vault} />}
        <div style={{ marginTop: 4, fontSize: 10, color: 'var(--ink-mute)', fontFamily: 'var(--font-mono)' }}>
          Bento v0.0.1
        </div>
      </div>
    </aside>
  );
}

function CollapsedRow({
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
      title={item.label}
      style={{
        width: 36,
        height: 32,
        borderRadius: 6,
        border: 'none',
        background: isActive ? 'var(--bg-shade)' : 'transparent',
        color: isActive ? 'var(--ink)' : 'var(--ink-mute)',
        fontFamily: 'var(--font-mono)',
        fontSize: 13,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {item.icon}
    </button>
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
      onMouseEnter={(e) => {
        if (isActive) return;
        e.currentTarget.style.background = 'var(--bg)';
        e.currentTarget.style.color = 'var(--ink)';
      }}
      onMouseLeave={(e) => {
        if (isActive) return;
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = 'var(--ink-2)';
      }}
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
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.label}
        </span>
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
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '0 0 auto' }}>
        {item.badge && (
          <span
            style={{
              background: 'var(--blue)',
              color: 'var(--on-accent)',
              borderRadius: 999,
              fontSize: 9.5,
              fontWeight: 700,
              minWidth: 16,
              height: 16,
              padding: '0 5px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {item.badge}
          </span>
        )}
        {item.count !== undefined && (
          <Mono style={{ fontSize: 11, color: isActive ? 'var(--ink-2)' : 'var(--ink-mute)' }}>
            {item.count}
          </Mono>
        )}
      </span>
    </button>
  );
}

function LlmCard({ llm, onClick }: { llm: LlmStatus | null; onClick?: () => void }) {
  const ready = !!llm?.binPresent && (llm?.models.length ?? 0) > 0;
  const running = !!llm?.running;
  const tone = running ? 'ok' : ready ? 'mute' : 'warn';
  const subline = !llm
    ? '확인 중…'
    : running
      ? `${trimGguf(llm.currentModel ?? '')} · ondevice`
      : ready
        ? `${llm.models.length} model${llm.models.length === 1 ? '' : 's'} · idle`
        : !llm.binPresent
          ? '바이너리 미설치'
          : '모델 없음';
  return (
    <button
      onClick={onClick}
      title="로컬 LLM 설정"
      style={{
        padding: '10px 12px',
        background: 'var(--bg)',
        border: '1px solid var(--line)',
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        textAlign: 'left',
        fontFamily: 'inherit',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 120ms, background 120ms',
      }}
      onMouseEnter={(e) => {
        if (!onClick) return;
        e.currentTarget.style.borderColor = 'var(--line-strong)';
        e.currentTarget.style.background = 'var(--bg-shade)';
      }}
      onMouseLeave={(e) => {
        if (!onClick) return;
        e.currentTarget.style.borderColor = 'var(--line)';
        e.currentTarget.style.background = 'var(--bg)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <StatusDot tone={tone} pulse={running} />
        <Mono style={{ fontSize: 10.5, color: 'var(--ink-2)' }}>LOCAL LLM</Mono>
      </div>
      <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>{subline}</Mono>
    </button>
  );
}

function VaultCard({ vault }: { vault: VaultInfo | null }) {
  return (
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
  );
}

function trimGguf(name: string): string {
  return name.replace(/\.gguf$/i, '');
}

function Topbar({
  llm,
  onToggleSidebar,
  onOpenSearch,
  onOpenQuick,
  onOpenTweaks,
}: {
  llm: LlmStatus | null;
  onToggleSidebar: () => void;
  onOpenSearch: () => void;
  onOpenQuick: (kind: QuickKind) => void;
  onOpenTweaks: () => void;
}) {
  const running = !!llm?.running;
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
      <div style={{ width: 78, flex: '0 0 78px', height: '100%' }} />
      <div style={{ display: 'inline-flex', alignItems: 'center', height: '100%' }}>
        <IconBtn title="사이드바 접기/열기" onClick={onToggleSidebar}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display: 'block' }}>
            <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" />
            <line x1="6" y1="2.5" x2="6" y2="13.5" stroke="currentColor" />
          </svg>
        </IconBtn>
      </div>
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          padding: '0 16px',
        }}
      >
        <button
          onClick={onOpenSearch}
          style={{
            display: 'inline-flex',
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
            lineHeight: 1,
            boxSizing: 'border-box',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ display: 'block' }}>
            <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.3" />
            <path d="M9.2 9.2 12 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <span style={{ flex: 1, textAlign: 'left' }}>노트 · 할일 · 클립 · 글 검색</span>
          <Kbd>⌘K</Kbd>
        </button>
      </div>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          height: '100%',
          gap: 6,
        }}
      >
        {running && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              height: 22,
              fontSize: 10,
              color: 'var(--blue)',
              background: 'var(--blue-soft)',
              padding: '0 8px',
              borderRadius: 999,
              fontFamily: 'var(--font-mono)',
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '0.05em',
              whiteSpace: 'nowrap',
              lineHeight: 1,
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: 999,
                background: 'var(--blue)',
              }}
            />
            ondevice
          </span>
        )}
        <QuickActionBtn
          title="빠른 생각 (⌘N)"
          onClick={() => onOpenQuick('thought')}
          accent="var(--ink-2)"
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ display: 'block' }}>
            <path d="M2 5c1.5-1.5 3-1.5 4.5 0S10 6.5 12 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            <path d="M2 9c1.5-1.5 3-1.5 4.5 0S10 10.5 12 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </QuickActionBtn>
        <QuickActionBtn
          title="빠른 할 일 (⌘T)"
          onClick={() => onOpenQuick('task')}
          accent="var(--warn)"
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ display: 'block' }}>
            <rect x="2" y="2" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M5 7.5 6.5 9 9 5.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </QuickActionBtn>
        <QuickActionBtn title="설정 (⌘,)" onClick={onOpenTweaks} accent="var(--ink)">
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ display: 'block' }}>
            <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.2" />
            <path
              d="M7 1.4v1.6M7 11v1.6M12.6 7H11M3 7H1.4M11 11l-1.1-1.1M4.1 4.1 3 3M11 3l-1.1 1.1M4.1 9.9 3 11"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </QuickActionBtn>
      </div>
    </header>
  );
}

function QuickActionBtn({
  children,
  title,
  onClick,
  accent,
}: {
  children: ReactNode;
  title: string;
  onClick: () => void;
  accent: string;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = accent;
        e.currentTarget.style.borderColor = 'var(--line-strong)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = 'var(--ink-soft)';
        e.currentTarget.style.borderColor = 'var(--line)';
      }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 28,
        padding: 0,
        border: '1px solid var(--line)',
        background: 'var(--bg)',
        color: 'var(--ink-soft)',
        borderRadius: 6,
        cursor: 'pointer',
        fontFamily: 'inherit',
        boxSizing: 'border-box',
        transition: 'color 120ms, border-color 120ms',
      }}
    >
      {children}
    </button>
  );
}

export function Shell({
  active,
  onSelect,
  children,
  onOpenLLMSetup,
  onOpenSearch,
  onOpenQuick,
  onOpenTweaks,
  thoughtsCount,
  blogEnabled,
}: {
  active: ScreenId;
  onSelect: (id: ScreenId) => void;
  children: ReactNode;
  onOpenLLMSetup: () => void;
  onOpenSearch: () => void;
  onOpenQuick: (kind: QuickKind) => void;
  onOpenTweaks: () => void;
  thoughtsCount?: number;
  blogEnabled: boolean;
}) {
  const [vault, setVault] = useState<VaultInfo | null>(null);
  const [llm, setLlm] = useState<LlmStatus | null>(null);
  const [counts, setCounts] = useState<Counts>({});
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('bento.sidebar.collapsed') === '1';
  });

  useEffect(() => {
    setCounts((prev) => ({ ...prev, thoughts: thoughtsCount }));
  }, [thoughtsCount]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('bento.sidebar.collapsed', collapsed ? '1' : '0');
  }, [collapsed]);

  useEffect(() => {
    if (blogEnabled) {
      vaultInfo()
        .then(setVault)
        .catch(() => setVault(null));
    } else {
      setVault(null);
    }
    let cancelled = false;
    const refreshCounts = async () => {
      try {
        const [docs, tasks, glean] = await Promise.all([
          blogEnabled ? listDocs().catch(() => []) : Promise.resolve([]),
          listTasks().catch(() => []),
          listGlean().catch(() => []),
        ]);
        if (cancelled) return;
        const undoneTasks = tasks.filter((t) => !t.done).length;
        const overdueTasks = (() => {
          const today = todayKey();
          return tasks.filter((t) => !t.done && t.due && dayKey(t.due) <= today).length;
        })();
        const unreadGlean = glean.filter((g) => g.status === 'unread').length;
        setCounts((prev) => ({
          ...prev,
          atelier: docs.length,
          plan: undoneTasks,
          planBadge: overdueTasks > 0 ? String(overdueTasks) : undefined,
          glean: glean.length,
          gleanBadge: unreadGlean > 0 ? String(unreadGlean) : undefined,
        }));
      } catch {
        if (!cancelled) setCounts({});
      }
    };
    refreshCounts();
    return () => {
      cancelled = true;
    };
  }, [blogEnabled]);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const s = await llmStatus();
        if (!cancelled) setLlm(s);
      } catch {
        if (!cancelled) setLlm(null);
      }
    };
    tick();
    const id = setInterval(tick, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)' }}>
      <Topbar
        llm={llm}
        onToggleSidebar={() => setCollapsed((c) => !c)}
        onOpenSearch={onOpenSearch}
        onOpenQuick={onOpenQuick}
        onOpenTweaks={onOpenTweaks}
      />
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Sidebar
          active={active}
          onSelect={onSelect}
          vault={vault}
          llm={llm}
          counts={counts}
          collapsed={collapsed}
          blogEnabled={blogEnabled}
          onOpenLLMSetup={onOpenLLMSetup}
        />
        <main style={{ flex: 1, minWidth: 0, overflow: 'auto' }}>{children}</main>
      </div>
    </div>
  );
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function dayKey(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return iso.slice(0, 10);
  const d = new Date(t);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
