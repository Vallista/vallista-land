import type { DocState, DocSummary } from '@vallista/content-core';
import { Mono } from '../../components/atoms/Atoms';

const STATE_DOT: Record<DocState, string> = {
  seed: 'var(--ink-mute)',
  sprout: 'var(--blue)',
  draft: 'var(--warn)',
  published: 'var(--ok)',
};

const STATE_LABEL: Record<DocState, string> = {
  seed: '씨앗',
  sprout: '새싹',
  draft: '초안',
  published: '공개',
};

type Props = {
  docs: DocSummary[];
  loading: boolean;
};

export function RecentDocs({ docs, loading }: Props) {
  if (loading) {
    return (
      <div
        style={{
          padding: '20px 0',
          color: 'var(--ink-faint)',
          fontSize: 12,
          fontFamily: 'var(--font-mono)',
        }}
      >
        읽는 중…
      </div>
    );
  }
  if (docs.length === 0) {
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
        아직 노트가 없습니다
      </div>
    );
  }
  return (
    <div>
      {docs.map((d) => (
        <Row key={d.path} doc={d} />
      ))}
    </div>
  );
}

function Row({ doc }: { doc: DocSummary }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '7px 4px',
        borderBottom: '1px solid var(--line)',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: STATE_DOT[doc.state],
          flex: '0 0 6px',
        }}
      />
      <span
        style={{
          flex: 1,
          minWidth: 0,
          color: 'var(--ink)',
          fontSize: 13.5,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {doc.title || '(제목 없음)'}
      </span>
      <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>{STATE_LABEL[doc.state]}</Mono>
      <Mono style={{ fontSize: 10, color: 'var(--ink-faint)' }}>{formatRel(doc.updatedAt)}</Mono>
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
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
