import { PageHead } from '../components/atoms/Atoms';

export function Publish() {
  return (
    <div style={{ padding: '32px 48px', maxWidth: 1120 }}>
      <PageHead title="발행" sub="발행 큐와 위생 검사 — M4에서 구현" />
      <p style={{ color: 'var(--ink-mute)', fontSize: 13 }}>
        draft 글의 발행 큐, slug/링크 위생 검사, git push 후 GitHub Actions 자동 빌드.
      </p>
    </div>
  );
}
