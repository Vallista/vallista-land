import { useEffect, useState } from 'react';
import { Eyebrow } from '../../components/atoms/Atoms';
import type { GleanCounts, ThreadsProfile } from '../../lib/tauri';
import { RssFeedPanel } from './RssDialog';
import { ThreadsProfilePanel } from './ThreadsProfilesDialog';
import { YoutubePanel } from './YoutubePanel';

export type SubsTab = 'rss' | 'threads' | 'youtube';

const TABS: { id: SubsTab; label: string; icon: string }[] = [
  { id: 'rss', label: 'RSS / 웹피드', icon: '⌬' },
  { id: 'youtube', label: 'YouTube', icon: '▷' },
  { id: 'threads', label: 'Threads', icon: '◎' },
];

interface Props {
  open: boolean;
  initialTab?: SubsTab;
  onClose: () => void;
  onSynced?: () => void;
  profiles: ThreadsProfile[];
  onProfilesChange: (profiles: ThreadsProfile[]) => void;
  counts: GleanCounts | null;
  onItemsRefresh: () => void;
}

export function SubscriptionsDialog({
  open,
  initialTab = 'rss',
  onClose,
  onSynced,
  profiles,
  onProfilesChange,
  counts,
  onItemsRefresh,
}: Props) {
  const [tab, setTab] = useState<SubsTab>(initialTab);

  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.32)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          display: 'grid',
          gridTemplateColumns: '176px 1fr',
          width: 760,
          maxWidth: 'calc(100vw - 48px)',
          height: 580,
          maxHeight: 'calc(100vh - 80px)',
          background: 'var(--bg)',
          border: '1px solid var(--line)',
          borderRadius: 12,
          color: 'var(--ink)',
          overflow: 'hidden',
        }}
      >
        {/* 좌측: 탭 사이드바 */}
        <aside
          style={{
            borderRight: '1px solid var(--line)',
            background: 'var(--bg-soft)',
            padding: '20px 0',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ padding: '0 16px 14px' }}>
            <Eyebrow>구독 관리</Eyebrow>
          </div>
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  width: '100%',
                  padding: '8px 16px',
                  border: 'none',
                  borderLeft: active ? '2px solid var(--blue)' : '2px solid transparent',
                  background: active ? 'var(--bg-shade)' : 'transparent',
                  color: active ? 'var(--ink)' : 'var(--ink-2)',
                  fontSize: 12.5,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: active ? 'var(--blue)' : 'var(--ink-mute)',
                    width: 14,
                    textAlign: 'center',
                  }}
                >
                  {t.icon}
                </span>
                {t.label}
              </button>
            );
          })}
          <div style={{ marginTop: 'auto', padding: '16px' }}>
            <button
              onClick={onClose}
              style={{
                width: '100%',
                padding: '6px 10px',
                border: '1px solid var(--line)',
                borderRadius: 5,
                background: 'var(--bg)',
                color: 'var(--ink-mute)',
                fontSize: 11,
                fontFamily: 'inherit',
                cursor: 'pointer',
              }}
            >
              닫기
            </button>
          </div>
        </aside>

        {/* 우측: 패널 콘텐츠 */}
        <div
          style={{
            overflow: 'auto',
            padding: 24,
          }}
        >
          {tab === 'rss' && <RssFeedPanel onSynced={onSynced} />}
          {tab === 'youtube' && <YoutubePanel onSynced={onSynced} />}
          {tab === 'threads' && (
            <ThreadsProfilePanel
              profiles={profiles}
              onProfilesChange={onProfilesChange}
              counts={counts}
              onItemsRefresh={onItemsRefresh}
            />
          )}
        </div>
      </div>
    </div>
  );
}
