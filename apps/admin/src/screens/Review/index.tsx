import { PageHead } from '../../components/atoms/Atoms';
import { SummaryReview } from '../Insights/WeeklyReview';

export function Review() {
  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--bg)' }}>
      <div
        style={{
          padding: 'calc(var(--gap-lg) * 2) calc(var(--gap-lg) * 3) 80px',
          maxWidth: 860,
        }}
      >
        <PageHead title="회고" sub="지난 주 · 지난 달 자동 정리" />
        <SummaryReview kind="weekly" />
        <SummaryReview kind="monthly" />
      </div>
    </div>
  );
}
