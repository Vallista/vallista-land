import type { GitCommit } from '../../lib/tauri';
import { Mono } from '../../components/atoms/Atoms';

export function CommitLog({ commits }: { commits: GitCommit[] }) {
  return (
    <div>
      {commits.map((c) => (
        <Row key={c.hash} commit={c} />
      ))}
    </div>
  );
}

function Row({ commit }: { commit: GitCommit }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '6px 4px',
        borderBottom: '1px solid var(--line)',
      }}
    >
      <Mono
        style={{
          fontSize: 10.5,
          color: 'var(--ink-mute)',
          flex: '0 0 60px',
        }}
      >
        {commit.hash}
      </Mono>
      <span
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: 12.5,
          color: 'var(--ink)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {commit.subject}
      </span>
      <Mono style={{ fontSize: 10, color: 'var(--ink-faint)' }}>{formatRel(commit.time)}</Mono>
    </div>
  );
}

function formatRel(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '';
  const diff = Date.now() - t;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return '방금';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  if (day < 30) return `${day}일 전`;
  const d = new Date(t);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
