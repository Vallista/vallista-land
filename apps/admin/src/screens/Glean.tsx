import { PageHead } from '../components/atoms/Atoms';

export function Glean() {
  return (
    <div style={{ padding: '32px 48px', maxWidth: 1120 }}>
      <PageHead title="줍기" sub="외부 콘텐츠 거두기 — M2에서 구현" />
      <p style={{ color: 'var(--ink-mute)', fontSize: 13 }}>
        URL/RSS/YouTube/공유 시트로 외부 콘텐츠를 거두고, "씨앗으로" 버튼만 도메인 경계를 넘깁니다.
      </p>
    </div>
  );
}
