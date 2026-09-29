import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { RadarActivity } from './types';

interface ActivityFeedProps {
  activities: RadarActivity[];
}

const SOURCE_LABEL: Record<string, string> = {
  slack: 'Slack',
  gitlab: 'GitLab',
  confluence: 'Confluence',
  app: '앱',
};

const SOURCE_COLOR: Record<string, string> = {
  slack: 'var(--blue)',
  gitlab: 'var(--warn)',
  confluence: 'var(--ok)',
  app: 'var(--ink-mute)',
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (activities.length === 0) return null;

  const sorted = [...activities].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div
      style={{
        padding: '0 calc(var(--gap-lg) + 6px)',
        marginTop: 'var(--gap)',
        paddingBottom: 24,
      }}
    >
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        style={headerBtnStyle}
      >
        <span>{collapsed ? '▸' : '▾'}</span>
        <span>업데이트 내역</span>
        <span style={badgeStyle}>{activities.length}</span>
      </button>

      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {sorted.map((activity) => (
            <ActivityRow key={activity.id} activity={activity} />
          ))}
        </div>
      )}
    </div>
  );
}

function ActivityRow({ activity }: { activity: RadarActivity }) {
  const color = SOURCE_COLOR[activity.sourceType] ?? 'var(--ink-mute)';
  const label = SOURCE_LABEL[activity.sourceType] ?? activity.sourceType;

  return (
    <div style={rowStyle}>
      <span
        style={{
          flex: '0 0 auto',
          padding: '1px 6px',
          borderRadius: 4,
          fontSize: 10,
          fontFamily: 'var(--font-mono)',
          background: 'var(--bg-shade)',
          color,
          letterSpacing: '0.03em',
        }}
      >
        {label}
      </span>
      <span style={{ flex: 1, color: 'var(--ink-2)', fontSize: 12, minWidth: 0 }}>
        {activity.message}
      </span>
      <span
        style={{
          flex: '0 0 auto',
          fontSize: 10.5,
          color: 'var(--ink-faint)',
          fontFamily: 'var(--font-mono)',
          whiteSpace: 'nowrap',
        }}
      >
        {formatRelative(activity.createdAt)}
      </span>
    </div>
  );
}

function formatRelative(iso: string): string {
  const ms = Date.now() - Date.parse(iso);
  if (!Number.isFinite(ms) || ms < 0) return '';
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return iso.slice(0, 10);
}

const headerBtnStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '6px 0',
  color: 'var(--ink-mute)',
  fontSize: 11,
  fontFamily: 'var(--font-mono)',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  width: '100%',
  marginBottom: 4,
};

const badgeStyle: CSSProperties = {
  padding: '1px 5px',
  borderRadius: 999,
  background: 'var(--bg-shade)',
  color: 'var(--ink-2)',
  fontSize: 10,
  fontFamily: 'var(--font-mono)',
};

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 8,
  padding: '6px 0',
  borderBottom: '1px solid var(--line)',
};
