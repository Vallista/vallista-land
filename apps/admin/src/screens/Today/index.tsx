import { PageHead } from '../../components/atoms/Atoms';

export function Today() {
  return (
    <div style={{ padding: '32px 48px', maxWidth: 1120 }}>
      <PageHead title="오늘" sub="M3.3에서 구현됩니다" />
      <p style={{ color: 'var(--ink-mute)', fontSize: 13 }}>
        Today 대시보드 — 오늘 할 일, 최근 노트, 최근 캡처, 빠른 캡처 입력이 들어옵니다.
      </p>
    </div>
  );
}
