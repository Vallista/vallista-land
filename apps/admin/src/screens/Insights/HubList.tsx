import type { InsightsDocWithDegree } from '../../lib/tauri';
import { Mono } from '../../components/atoms/Atoms';

export function HubList({ hubs }: { hubs: InsightsDocWithDegree[] }) {
  if (hubs.length === 0) {
    return (
      <div
        style={{
          padding: '24px 0',
          color: 'var(--ink-mute)',
          fontSize: 13,
          fontStyle: 'italic',
          textAlign: 'center',
        }}
      >
        아직 연결이 없습니다
      </div>
    );
  }
  const max = Math.max(...hubs.map((h) => h.inCount + h.outCount));
  return (
    <div>
      {hubs.map((h) => (
        <Row key={h.id || h.path} hub={h} max={max} />
      ))}
    </div>
  );
}

function Row({ hub, max }: { hub: InsightsDocWithDegree; max: number }) {
  const total = hub.inCount + hub.outCount;
  const ratio = max > 0 ? total / max : 0;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '6px 4px',
        borderBottom: '1px solid var(--line)',
      }}
      title={hub.path}
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
        {hub.title || hub.path}
      </span>
      <div
        aria-hidden
        style={{
          width: 60,
          height: 4,
          background: 'var(--bg-shade)',
          borderRadius: 999,
          overflow: 'hidden',
          flex: '0 0 60px',
        }}
      >
        <div
          style={{
            width: `${ratio * 100}%`,
            height: '100%',
            background: 'var(--blue)',
            opacity: 0.7,
          }}
        />
      </div>
      <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)', flex: '0 0 auto' }}>
        ↘{hub.inCount} ↗{hub.outCount}
      </Mono>
    </div>
  );
}
