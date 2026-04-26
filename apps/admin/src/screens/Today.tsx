import { PageHead } from '../components/atoms/Atoms';

export function Today() {
  return (
    <div style={{ padding: '32px 48px', maxWidth: 1120 }}>
      <PageHead title="오늘" sub="하루를 시작하는 단 하나의 화면 — M3에서 구체화" />
      <p style={{ color: 'var(--ink-mute)', fontSize: 13 }}>
        Today 화면은 M3에서 구현됩니다. 시간 블록, 사람, 루틴, 라이프 히트맵, 빠른 캡처가 들어옵니다.
      </p>
    </div>
  );
}
