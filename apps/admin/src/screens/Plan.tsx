import { PageHead } from '../components/atoms/Atoms';

export function Plan() {
  return (
    <div style={{ padding: '32px 48px', maxWidth: 1120 }}>
      <PageHead title="할 일" sub="주간 캘린더 + AI 시간 제안 — M3에서 구현" />
      <p style={{ color: 'var(--ink-mute)', fontSize: 13 }}>
        TODO 인박스, 읽기 큐, 주간 캘린더 타임블록이 들어옵니다.
      </p>
    </div>
  );
}
