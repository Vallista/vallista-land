import { PageHead } from '../components/atoms/Atoms';

export function Insights() {
  return (
    <div style={{ padding: '32px 48px', maxWidth: 1120 }}>
      <PageHead title="돌아보기" sub="패턴 발견 — M5에서 구현" />
      <p style={{ color: 'var(--ink-mute)', fontSize: 13 }}>
        링크 그래프, 고립된 섬, 자라지 못한 씨앗, 테마 클러스터.
      </p>
    </div>
  );
}
